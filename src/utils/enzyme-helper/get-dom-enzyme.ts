import fs from 'fs';
import { runCommand } from '../shell-helper/shell-helper';
import { getConfigProperty, getJestBinaryPath } from '../config';

/**
 * Get React component DOM for test cases
 * @param filePath
 * @returns
 */
export const getReactCompDom = async (filePath: string): Promise<string> => {
    console.log('\nGetting rendered component code');
    /**
     * Copy mount adapters file collecting DOM tree to host project
     * Write the string to a file
     */
    // Create a csv file path with DOM for test cases
    const domTreeFilePath = getConfigProperty('collectedDomTreeFilePath');
    const enzymeRenderAdapterFilePath = getConfigProperty('enzymeMountAdapter');
    const enzymeRenderAdapterCode = getenzymeRenderAdapterCode(domTreeFilePath);
    fs.writeFileSync(
        enzymeRenderAdapterFilePath,
        enzymeRenderAdapterCode,
        'utf8',
    );

    // Create new Enzyme file with Enzyme mounts overwrite
    const filePathWithEnzymeAdapter = getConfigProperty(
        'filePathWithEnzymeAdapter',
    );
    await overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter);

    // Create jest command to run tests
    const jestCommand = `${getJestBinaryPath()} ${filePathWithEnzymeAdapter}`;

    // Run jest command
    try {
        await runCommand(jestCommand);
    } catch (error) {
        console.log(`Did not work jestCommand. Error: ${error}`);
    }

    // Return output
    let domTreeOutput =
        'Could not collect DOM for test cases. Proceed without DOM';
    try {
        domTreeOutput = fs.readFileSync(domTreeFilePath, 'utf-8');
    } catch (error) {
        console.log(
            `Could not open the file. Error in outputting file ${error}`,
        );
    }
    console.log('Getting rendered component code: DONE');
    return domTreeOutput;
};
/**
 * Overwrite enzyme methods to collect DOM for test case renders
 * @param filePath
 * @param filePathWithEnzymeAdapter
 * @returns
 */
const overwriteEnzymeMounts = async (
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
    } else {
        throw new Error(
            'No Enzyme imports detected. Is this an Enzyme file? Or is it using helper functions that call Enzyme mounting methods?',
        );
    }
};

/**
 * Create string with enzyme mount adapters
 * @param collectedDomTreeFilePath
 * @returns
 */
const getenzymeRenderAdapterCode = (
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
