# Enzyme to RTL codemod
This package is designed to help with automated conversion of jest tests from Enzyme to RTL. It's intended to be used with your own implementation of the LLM.

# Note
Due to the numerous requests from external developers we are open sourcing a version of our Slack built tool for Enzyme to RTL conversions. This tool is not meant to be complete and working for all use cases, but rather an effort to share our approach that can serve as a starting point to automate it for others. With 1.5 million Enzyme downloands from npm (as of Sep 2024), we would like to help out others to make this journey less miserable and save some time. And also showcase a useful and working case for LLM integration in developer work. We are hoping this tool is helpful for you. We suggest making contributions to this repo or forking it and make necessary changes. We will still provide limited support for reviewing work for critical bug fixes.

# Requirements 
1. Jest: This package depends on your host project jest binary and configuration. See API/Usage for more info.
2. Enzyme - this package depends on your host project Enzyme version
3. Jscodeshift - installed as part of this package
4. LLM support
    1. You will need to call an LLM with the generated prompt provided
    2. You will need to implement it yourself with your available LLM model
    3. LLM is instructed to return code in certain xml tags, that allows extracting that code for any model

# How to install
1. Install the package
```bash
npm install @slack/enzyme-to-rtl-codemod
```
or
``` bash
yarn add @slack/enzyme-to-rtl-codemod
```
# API/Usage
There three ways to use this package:
1. Using one workflow function `convertTestFiles({...})` 
2. Using many individual functions with more control over the flow
3. cli (not implemented)

## 1. Run conversion flow for one or more files with one method in a script by using `convertTestFiles()` function:
1. Example
```ts
// Import convertTestFiles, LLMCallFunction and SummaryJson types
import { convertTestFiles, LLMCallFunction, SummaryJson } from '@slack/enzyme-to-rtl-codemod';

// Example implementation of the LLM call function
const callLLMFunctionExample: LLMCallFunction = async (prompt: string): Promise<string> => {
    // Step 1: Configure LLM parameters
    const config = {
        // Add your LLM configuration parameters here
        // Consider lowering the temperature (0.2) for more deterministic results
    };

    // Step 2: Call the LLM with the provided prompt
    const LLLresponse = await callLLMapi(config, prompt);

    // Step 3: Return the result
    return LLLresponse; 
};

// Implement convertTestFiles function call with your arguments
// See Exported methods section for more details about convertTestFiles
const convertFiles = async (filePaths: string[]) => {
	const results = await convertTestFiles({
		filePaths: filePaths,
		jestBinaryPath: 'npx jest',
		outputResultsPath: 'ai-conversion-testing/temp',
		testId: 'data-test',
		llmCallFunction: callLLMFunctionExample,
		enableFeedbackStep: true,
	});
	
	console.log('results:', results)
}

const enzymeFilePaths = [
	'path/to/your/enzymeFile1.jest.tsx',
    'path/to/your/enzymeFile2.jest.tsx',
]

// Run the function and check logs and outputResultsPath for results
convertFiles(enzymeFilePaths);

```

## 2. Run conversion flow with individual methods for one file in a script:
This approach gives you more control of the flow and ability to inspect the output of each method. Or maybe you just want to get AST converted code.
The order of methods used must be respected, as the flow depends on it
1. Import all the individual methods. See Exported methods section for more info on each method
```ts
// Import all the methods
import {
	initializeConfig,
	convertWithAST,
	getReactCompDom,
	generateInitialPrompt,
	extractCodeContentToFile,
	runTestAndAnalyze,
	generateFeedbackPrompt,
} from '@slack/enzyme-to-rtl-codemod';
// Import llm call method helper
import { callLLM } from './llm-helper';

const convertTestFile = async (filePath: string): Promise<void> => {
   	// Initialize config
	const config = initializeConfig({
		filePath,
		jestBinaryPath: 'npx jest',
		outputResultsPath: 'ai-conversion-testing/temp',
		testId: 'data-test',
	});

    // Get AST conversion
	// Note: use config properties
	const astConvertedCode = convertWithAST({
		filePath,
		testId: config.testId,
		astTransformedFilePath: config.astTranformedFilePath,
	});

    // Get React Component DOM tree for each test case
	const reactCompDom = await getReactCompDom({
		filePath,
		enzymeImportsPresent: config.enzymeImportsPresent,
		filePathWithEnzymeAdapter: config.filePathWithEnzymeAdapter,
		collectedDomTreeFilePath: config.collectedDomTreeFilePath,
		enzymeMountAdapterFilePath: config.enzymeMountAdapterFilePath,
		jestBinaryPath: config.jestBinaryPath,
		reactVersion: config.reactVersion,
	});

    // Generate the prompt
	const initialPrompt = generateInitialPrompt(
		{
			filePath,
			getByTestIdAttribute: config.testId,
			astCodemodOutput: astConvertedCode,
			renderedCompCode: reactCompDom,
			originalTestCaseNum: config.originalTestCaseNum,
		}
	)

    /**
	 * Call LLM with the generated prompt
	 * 1. This would be specific for your LLM
	 * 2. We only provide tooling for context gathering and prompt generation
	 * 3. The prompt string should be LLM agnostic
	 */
	// Create a prompt, make a request, get a response
	const LLMresponse = await callLLM(initialPrompt);

	// Extract generated code
	const convertedFilePath = extractCodeContentToFile({
		LLMresponse,
		rtlConvertedFilePath: config.rtlConvertedFilePathAttmp1,
	});

    // Run the file and analyze the failures
	const attempt1Result = await runTestAndAnalyze({
		filePath: convertedFilePath,
		jestBinaryPath: config.jestBinaryPath,
		jestRunLogsPath: config.jestRunLogsFilePathAttmp1,
		rtlConvertedFilePath: config.rtlConvertedFilePathAttmp1,
		outputResultsPath: config.outputResultsPath,
		originalTestCaseNum: config.originalTestCaseNum,
		summaryFile: config.jsonSummaryPath,
		attempt: 'attempt1',
	});

    // Store results
    let finalResult = attempt1Result;

    // Step to call LLM if attempt 1 failed
    // This is optional, but can add 5-20% better results
	if (!attempt1Result.attempt1.testPass) {
		// Create feedback command
		const feedbackPrompt = generateFeedbackPrompt({
			rtlConvertedFilePathAttmpt1: config.rtlConvertedFilePathAttmp1,
			getByTestIdAttribute: config.testId,
			jestRunLogsFilePathAttmp1: config.jestRunLogsFilePathAttmp1,
			renderedCompCode: reactCompDom,
			originalTestCaseNum: config.originalTestCaseNum,
		});

		// Call the API with a custom LLM method
		const LLMresponseAttmp2 = await callLLM(feedbackPrompt);

		// Extract generated code
		const convertedFeedbackFilePath = extractCodeContentToFile({
			LLMresponse: LLMresponseAttmp2,
			rtlConvertedFilePath: config.rtlConvertedFilePathAttmp2,
		});

		// Run the file and analyze the failures
		const attempt2Result = await runTestAndAnalyze({
			filePath: convertedFeedbackFilePath,
			jestBinaryPath: config.jestBinaryPath,
			jestRunLogsPath: config.jestRunLogsFilePathAttmp2,
			rtlConvertedFilePath: config.rtlConvertedFilePathAttmp2,
			outputResultsPath: config.outputResultsPath,
			originalTestCaseNum: config.originalTestCaseNum,
			summaryFile: config.jsonSummaryPath,
			attempt: 'attempt2'
		});
		// Update finalResult to include attempt2Result
        finalResult = attempt2Result;
	}

	// Output final result
	console.log('final result:', finalResult);
};

// Run the function and see logs and files in `outputResultsPath`
convertTestFile(
	'<testPath1>'
);
```
## 3. Run conversion flow with cli and config for one file or more files:
<!-- TODO -->


## Exported methods
This package exports the following:

### Configuration
1. `initializeConfig` - Initialize configuration settings required for the conversion process. This method prepares paths and settings, such as Jest binary, output paths, and test identifiers.
```ts
interface InitializeConfigArgs {
    filePath: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    logLevel?: LogLevel;
}

const config = initializeConfig({
    filePath: 'weekly/__tests__/weekly-report-table.test.js',
    jestBinaryPath: 'npx jest',
    outputResultsPath: 'ai-conversion-testing/temp',
    testId: 'data-test',
    logLevel: 'verbose',  // Optional; defaults to 'info'
});
```

### Conversion flow methods
2. `convertTestFiles` - run the conversion flow in one method. Easy and fast way to start converting
```ts
/**
 * Converts test files and processes them using the specified parameters.
 *
 * This function accepts an array of test file paths and performs a series of operations
 * including setting up Jest environment, initializing configuration, and generating output results.
 * It utilizes a Large Language Model (LLM) for assisting in code transformations and analysis.
 * Results from the conversions, including test outcomes, are saved in the specified output directory.
 * The function supports feedback loops to refine transformations in case of initial failure.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string[]} params.filePaths - The array of test file paths to be processed.
 * @param {string} [params.logLevel] - Optional log level to control verbosity of logs. 'info' or 'verbose'
 * @param {string} params.jestBinaryPath - Path to the Jest binary for running tests.
 * @param {string} params.outputResultsPath - The directory where output results should be stored.
 * @param {string} params.testId - The identifier for tracking and processing tests.
 * @param {LLMCallFunction} params.llmCallFunction - Function for making LLM API calls to process the tests.
 * @param {string[]} [params.extendInitialPrompt] - Optional array of additional instructions for the initial LLM prompt.
 * @param {boolean} params.enableFeedbackStep - Flag indicating whether to enable feedback-based refinement in case of failed tests.
 * @param {string[]} [params.extendFeedbackPrompt] - Optional array of additional instructions for the feedback LLM prompt.
 * @returns {Promise<SummaryJson>} A promise that resolves to the generated summary JSON object containing the results of the test conversions.
 */
export const convertTestFiles = async ({
    filePaths,
    logLevel,
    jestBinaryPath,
    outputResultsPath,
    testId,
    llmCallFunction,
    extendInitialPrompt,
    enableFeedbackStep,
    extendFeedbackPrompt,
}: {
    filePaths: string[];
    logLevel?: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    llmCallFunction: LLMCallFunction;
    extendInitialPrompt?: string[];
    enableFeedbackStep: boolean;
    extendFeedbackPrompt?: string[];
}): Promise<SummaryJson> => {
```


1. `convertWithAST` - Run AST conversions and annotations on a test file.
```ts
const astConverted = await convertWithAST(filePath);
```
1. `getReactComponentDOM` - Collect the DOM tree for each test case in your file.
```ts
const reactCompDom = await getReactComponentDOM(filePath);
```
1. `generatePrompt` - generate prompt with all the necessary info. Extend it with extendPrompt: string[] that would enumerate each array item and add to the main prompt
```ts
const prompt = await generatePrompt(filePath, 'data-qa', astConverted, reactCompDom, extendPrompt?);
```
1. `extractCodeContent` - extract code from the LLM response
```ts
const convertedFilePath = extractCodeContent(LLMResponse);
```
1. `TestResult` - type of return object for `runTestAndAnalyze`
1. `runTestAndAnalyze` - run the converted test file and analyze the logs. Return an object of `TestResult` type
```ts
await runTestAndAnalyze(convertedFilePath);
```
1. `LLMCallFunction` - llm function type
```ts
export type LLMCallFunction = (prompt: string) => Promise<string>;
```
1. `TestResults` - test run results type returned by `convertTestFiles`
1. `convertTestFiles` - run the conversion flow in one method. See methods above that correspond to parameters below
```ts
export const convertTestFiles = async ({
    filePaths,
    logLevel,
    jestBinaryPath,
    outputResultsPath,
    testId,
    llmCallFunction,
    extendPrompt,
}: {
    filePaths: string[];
    logLevel?: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    llmCallFunction: LLMCallFunction;
    extendPrompt?: string[];
}): Promise<SummaryJson> =>...
```

# Output results
Results will be written to the outputResultsPath/<timeStampFolder>/<filePath>/* folder
1. ast-transformed-file.jest.tsx - AST converted/annotated file
2. enzyme-mount-overwrite.jest.tsx - Your file with overwritten Enzyme rendering methods that emit DOM for test cases 
3. enzyme-render-adapter.ts - Enzyme rendering methods with DOM logs collection logic
4. rtl-converted-file.jest.tsx - Converted RTL file
5. test-cases-dom-tree.csv - CSV with DOM tree for each test case
6. jest-test-run-logs.md - Jest run logs for your RTL file
7. summary.json - summary of conversions

# NOTE:
1. This package will only work if your test files use Enzyme `mount` and `shallow` imported directly from Enzyme package. If you use helper methods to mount the components it will not work
```ts
import { mount } from 'enzyme';
```
2. This package works only with jest, no other test runners have been tested
3. `enzyme-mount-adapter.js` is a Javascript file to enable this for project that do not use Typescript
4. `convertWithAST` method must be run before getting DOM tree for the Enzyme file, because that method sets the paths. See example in section 2. Run conversion flow with individual methods for one file in a script

# Debugging
1. By default log level is `info`
2. Set the log level to `verbose` by importing and setting `configureLogLevel('verbose')`
