import fs from 'fs';
import { runCommand } from '../shell-helper/shell-helper';
import { getConfigProperty, getJestBinaryPath } from '../config';
import createCustomLogger from '../logger/logger';

export const getDomEnzymeLogger = createCustomLogger('Get DOM Enzyme');

// TODO: remove child process and try running directly with jest apis

/**
 * Get React component DOM for test cases
 * @param filePath
 * @returns
 */
export const getReactCompDom = async (filePath: string): Promise<string> => {
    getDomEnzymeLogger.info('Start: getting rendered component code');

    // Check if file has Enzyme imports for mount/shallow
    if (!getConfigProperty('enzymeImportsPresent')) {
        getDomEnzymeLogger.warn(
            'No Enzyme imports present. Cannot collect logs. Continue...',
        );
        // TODO: when testing. Check what the best return string should be
        // Maybe return null and do not include this as part of the prompt
        return 'Could not collect DOM for test cases. Proceed without DOM';
    }

    /**
     * Copy mount adapters file collecting DOM tree to host project
     * Write the string to a file
     */
    // Get a csv file path with DOM for test cases
    getDomEnzymeLogger.verbose('Get domTreeFilePath');
    const domTreeFilePath = getConfigProperty('collectedDomTreeFilePath');

    // Create a string with enzyme shallow/mount adapters wih the path to csv for DOM tree
    getDomEnzymeLogger.verbose('Get enzymeRenderAdapterCode');
    const enzymeRenderAdapterCode = getenzymeRenderAdapterCode(domTreeFilePath);

    // Get the path to the file for enzymeRenderAdapterCode
    getDomEnzymeLogger.verbose('Get enzymeRenderAdapterFilePath');
    const enzymeMountAdapterFilePath = getConfigProperty(
        'enzymeMountAdapterFilePath',
    );

    // Create a file with shallow/enzyme adapter that collects DOM
    getDomEnzymeLogger.verbose('Create shallow/enzyme adapter to collect DOM');
    fs.writeFileSync(
        enzymeMountAdapterFilePath,
        enzymeRenderAdapterCode,
        'utf8',
    );

    // Create new Enzyme file with Enzyme mounts overwrite
    getDomEnzymeLogger.verbose('Get filePathWithEnzymeAdapter');
    const filePathWithEnzymeAdapter = getConfigProperty(
        'filePathWithEnzymeAdapter',
    );

    getDomEnzymeLogger.verbose('Overwrite enzyme shallow/mount import methods');
    await overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter);

    // Create jest command to run tests
    getDomEnzymeLogger.verbose('Generate jest command');
    const jestCommand = `${getJestBinaryPath()} ${filePathWithEnzymeAdapter}`;

    // Run jest command
    try {
        getDomEnzymeLogger.verbose(
            `Run jest file with command: ${jestCommand}`,
        );
        await runCommand(jestCommand);
    } catch (error) {
        console.log(`Did not work jestCommand. Error: ${error}`);
    }

    // Return output
    let domTreeOutput =
        'Could not collect DOM for test cases. Proceed without DOM';
    try {
        getDomEnzymeLogger.verbose(
            `Getting collected DOM from ${domTreeFilePath}`,
        );
        domTreeOutput = fs.readFileSync(domTreeFilePath, 'utf-8');
    } catch (error) {
        getDomEnzymeLogger.warn(
            `Could not collect DOM logs from ${domTreeFilePath}.\nError: ${error}`,
        );
    }
    getDomEnzymeLogger.info('Done: getting rendered component code');
    return domTreeOutput;
};

/**
 * Overwrite enzyme methods to collect DOM for test case renders
 * import { mount } from 'enzyme';
 * to
 * import { mount, shallow } from './enzyme-mount-adapter';
 * @param filePath
 * @param filePathWithEnzymeAdapter
 * @returns
 */
export const overwriteEnzymeMounts = async (
    filePath: string,
    filePathWithEnzymeAdapter: string,
): Promise<void> => {
    // Regex to match the import statement
    const importStatementRegex = /(import\s*{[^}]*}\s*from\s*'enzyme'\s*;)/;

    // Get file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const match = fileContent.match(importStatementRegex);
    const matchedImportString = match && match[1];

    // Direct import from enzyme
    // Check if matched and doesn't have 'type' in it, to avoid `import type { ReactWrapper } from 'enzyme';`
    if (matchedImportString && !matchedImportString.includes('type')) {
        const updatedContent: string = fileContent.replace(
            matchedImportString,
            "import { mount, shallow } from './enzyme-mount-adapter';",
        );
        fs.writeFileSync(filePathWithEnzymeAdapter, updatedContent, 'utf-8');
    }
};

/**
 * Create string with enzyme mount adapters
 * @param collectedDomTreeFilePath
 * @returns
 */
export const getenzymeRenderAdapterCode = (
    collectedDomTreeFilePath: string,
): string => {
    // TODO: if file is in ts use TS adapter. If not, use JS
    const enzymeRenderAdapterCodeJS = `
// Import original methods
import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import fs from 'fs';

// Set up Enzyme with the adapter
enzyme.configure({ adapter: new Adapter() });

let currentTestCaseName = null;

beforeEach(() => {
    // Set the current test case name before each test
    const testName = expect.getState().currentTestName;
    currentTestCaseName = testName ? testName.trim() : null;
});

afterEach(() => {
    // Reset the current test case name after each test
    currentTestCaseName = null;
});

// Overwrite mount method
enzyme.mount = (node, options) => {
    const wrapper = originalMount(node, options);
    const htmlContent = wrapper.html();
	fs.appendFileSync(
		'${collectedDomTreeFilePath}',
		\`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>\${htmlContent}</dom_tree>;\`,
	);
    return wrapper;
};

// Overwrite shallow method
enzyme.shallow = (node, options) => {
    const wrapper = originalShallow(node, options);
    let resultString;

    try {
        // Try to get HTML
        const htmlContent = wrapper.html();
		resultString = \`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>\${htmlContent}</dom_tree>;\`;
    } catch (htmlError) {
        // If html() fails, use debug() as a fallback
        try {
			const debugContent = wrapper.debug().replace(/\\n/g, ' ');
			resultString = \`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>\${debugContent}</dom_tree>;\`;
        } catch (debugError) {
            // If both html() and debug() fail, provide a default string or handle the error as needed
			resultString = \`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>Failed to retrieve DOM tree</dom_tree>;f\`;
        }
    }
	fs.appendFileSync('${collectedDomTreeFilePath}', resultString);
    return wrapper;
};

export const { shallow, mount } = enzyme;
	`;
    const enzymeRenderAdapterCodeTS = `
// Import original methods
import enzyme, { mount as originalMount, shallow as originalShallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import fs from 'fs';

// Set up Enzyme with the adapter
enzyme.configure({ adapter: new Adapter() });

let currentTestCaseName: string | null = null;

beforeEach(() => {
	// Set the current test case name before each test
	const testName = expect.getState().currentTestName;
	currentTestCaseName = testName ? testName.trim() : null;
});

afterEach(() => {
	// Reset the current test case name after each test
	currentTestCaseName = null;
});

// Overwrite mount method
enzyme.mount = (node: React.ReactElement, options?: enzyme.MountRendererProps) => {
	const wrapper = originalMount(node, options);
	const htmlContent = wrapper.html();
	fs.appendFileSync(
		'${collectedDomTreeFilePath}',
		\`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>\${htmlContent}</dom_tree>;\`,
	);
	return wrapper;
};

// Overwrite shallow method
enzyme.shallow = (node: React.ReactElement, options?: enzyme.ShallowRendererProps) => {
	const wrapper = originalShallow(node, options);
	let resultString;

	try {
		// Try to get HTML
		const htmlContent = wrapper.html();
		resultString = \`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>\${htmlContent}</dom_tree>;\`;
	} catch (htmlError) {
		// If html() fails, use debug() as a fallback
		try {
			const debugContent = wrapper.debug().replace(/\\n/g, ' ');
			resultString = \`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>\${debugContent}</dom_tree>;\`;
		} catch (debugError) {
			// If both html() and debug() fail, provide a default string or handle the error as needed
			resultString = \`<test_case_title>\${currentTestCaseName}</test_case_title> and <dom_tree>Failed to retrieve DOM tree</dom_tree>;f\`;
		}
	}
	fs.appendFileSync('${collectedDomTreeFilePath}', resultString);
	return wrapper;
};

export const { shallow, mount } = enzyme;
`;
    return enzymeRenderAdapterCodeJS;
};
