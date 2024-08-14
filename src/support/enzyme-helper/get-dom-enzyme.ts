import fs from 'fs';
import { Config } from '@jest/types';
import { runCommand } from '../shell-helper/shell-helper';
import { getConfigProperty } from '../config';
import createCustomLogger from '../logger/logger';
import { promisify } from 'util';
import path from 'path';

export const getDomEnzymeLogger = createCustomLogger('Get DOM Enzyme');

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

    // Create setup for collecting DOM for rendered components in tests
    getDomEnzymeLogger.verbose('Create enzyme adapter to collect DOM');
    createEnzymeAdapter();

    // Create new Enzyme file with Enzyme mounts overwrite
    getDomEnzymeLogger.verbose('Get filePathWithEnzymeAdapter');
    const filePathWithEnzymeAdapter = getConfigProperty(
        'filePathWithEnzymeAdapter',
    );

    getDomEnzymeLogger.verbose('Overwrite enzyme shallow/mount import methods');
    await overwriteEnzymeMounts(filePath, filePathWithEnzymeAdapter);

    // TODO: test if we can use jest api's directly
    // Run tests with child process
    getDomEnzymeLogger.verbose('Run Enzyme jest test to collect DOM');
    await runJestInChildProcess(filePathWithEnzymeAdapter);

    // Run tests with jest api directly
    // 'jest.config.js' -- TODO: add to config and expose api to set it
    await runJestDirectly(filePathWithEnzymeAdapter, 'jest.config.js');

    // Return output
    getDomEnzymeLogger.verbose('Get DOM tree output');
    const domTreeOutput = getDomTreeOutputFromFile();

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
 * Create Enzyme adapter with overwritten mount/shallow methods that collect DOM in each test case
 */
export const createEnzymeAdapter = (): void => {
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
        'utf-8',
    );
};

/**
 * Run command in a child process
 * @param jestCommand
 * @returns
 */
export const runJestInChildProcess = async (
    filePathWithEnzymeAdapter: string,
): Promise<void> => {
    getDomEnzymeLogger.verbose('Generate jest command');
    const jestCommand = `${getConfigProperty('jestBinaryPath')} ${filePathWithEnzymeAdapter}`;
    try {
        getDomEnzymeLogger.verbose(
            `Run jest file with command: ${jestCommand}`,
        );
        await runCommand(jestCommand);
    } catch (error) {
        getDomEnzymeLogger.warn(
            `Could not run jest command command: ${jestCommand}`,
        );
        getDomEnzymeLogger.warn(`Error: ${error}`);
    }
};

/**
 * Get collected DOM from a file
 * @returns
 */
export const getDomTreeOutputFromFile = (): string => {
    let domTreeOutput =
        'Could not collect DOM for test cases. Proceed without DOM';

    const collectedDomTreeFilePath = getConfigProperty(
        'collectedDomTreeFilePath',
    );
    try {
        getDomEnzymeLogger.verbose(
            `Getting collected DOM from ${collectedDomTreeFilePath}`,
        );
        domTreeOutput = fs.readFileSync(collectedDomTreeFilePath, 'utf-8');
    } catch (error) {
        getDomEnzymeLogger.warn(
            `Could not collect DOM logs from ${getConfigProperty('collectedDomTreeFilePath')}.\nError: ${error}`,
        );
    }
    return domTreeOutput;
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

// TODO: test on a different repo to make sure this works
/**
 * Run tests with jest api's directly
 * @param testFilePath
 * @param jestConfigPath
 */
export const runJestDirectly = async (
    testFilePath: string,
    jestConfigPath: string,
): Promise<void> => {
    try {
        // Create path to Enzyme file to run
        const filePathWithEnzymeAdapter = path.join(
            process.cwd(),
            testFilePath,
        );

        // Create path to jest config file in host project
        const jestConfigPathAbsolute = path.join(process.cwd(), jestConfigPath);

        // Automatically use the current working directory as the host project root
        const hostProjectRoot = process.cwd();

        // Resolve the Jest CLI module from the host project's node_modules
        const jestPath = require.resolve('jest', { paths: [hostProjectRoot] });

        // Import the Jest CLI from the resolved path
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { runCLI } = require(jestPath);

        // Read and parse the host project's Jest configuration
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const hostJestConfig = require(jestConfigPathAbsolute);

        // TODO: add logic here to make sure it doesn't break
        delete hostJestConfig.testRegex;

        // Options for running Jest tests
        const options: Config.Argv = {
            ...hostJestConfig, // Use the host project's Jest config
            runInBand: true, // Run tests in a single process
            silent: true, // Suppress output unless there's an error
            testMatch: [filePathWithEnzymeAdapter], // Match the specific test file
        };

        // Execute Jest tests using the host project's configuration
        await promisify(runCLI)(options, [hostProjectRoot]);

        // TODO: return const {results} = ... and check that tests passed, if needed
        // return results;
    } catch (error) {
        getDomEnzymeLogger.warn(`Could not run Enzyme tests.\nError: ${error}`);
    }
};

// const result = runJestDirectly(
//     'src/support/enzyme-helper/enzyme-working-file.jest.tsx',
//     'jest.config.js',
// );
