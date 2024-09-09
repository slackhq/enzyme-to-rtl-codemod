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
### TODO

# Output results
Results will be written to the outputResultsPath/<timeStampFolder>/<filePath>/* folder
```
└── 2024-09-05_16-15-41
   ├── <file-path>
   |  ├── ast-transformed-<file_title>.test.tsx  - AST converted/annotated file
   |  ├── attmp-1-jest-run-logs-<file_title>.md - Jest run logs for RTL file attempt 1
   |  ├── attmp-1-rtl-converted-<file_title>.test.tsx - Converted Enzyme to RTL file attempt 1
   |  ├── attmp-2-jest-run-logs-<file_title>.md - Jest run logs for RTL file attempt 2
   |  ├── attmp-2-rtl-converted-<file_title>.test.tsx - Converted Enzyme to RTL file attempt 2
   |  ├── dom-tree-<file_title>.csv - Collected DOM for each test case in Enzyme file
   |  ├── enzyme-mount-adapter.js - Enzyme rendering methods with DOM logs collection logic
   |  └── enzyme-mount-overwritten-<file_title>.test.tsx - Enzyme file with new methods that emit DOM
```

# NOTE:
1. This package will only work if your test files use Enzyme `mount` and `shallow` imported directly from Enzyme package. If you use helper methods to mount the components it will not work
```ts
import { mount } from 'enzyme';
```
2. This package works only with jest, no other test runners have been tested

# Debugging
1. By default log level is `info`
2. Set the log level to `verbose` in `convertFiles` or `initializeConfig`

## Exported methods
This package exports the following:
1. `convertTestFiles` - run the conversion flow in one function. Easy and fast way to start converting
```ts
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
2. `LLMCallFunction` - llm call function type
```ts
export type LLMCallFunction = (prompt: string) => Promise<string>;
```
3. `initializeConfig` - Initialize configuration settings required for the conversion process. This method prepares paths and settings, such as Jest binary, output paths, and test identifiers.
```ts
interface InitializeConfigArgs {
    filePath: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    logLevel?: LogLevel;
}

export const initializeConfig = ({
    filePath,
    jestBinaryPath,
    outputResultsPath,
    testId,
    logLevel = 'info',
}: InitializeConfigArgs): Config => {
```
4. `convertWithAST` - Run jscodeshift and make AST conversions/annotations.
```ts
export const convertWithAST = ({
    filePath,
    testId,
    astTransformedFilePath,
}: {
    filePath: string;
    testId: string;
    astTransformedFilePath: string;
}): string => {
```
5. `getReactCompDom` - Get React component DOM for test cases.
```ts
export const getReactCompDom = async ({
    filePath,
    enzymeImportsPresent,
    filePathWithEnzymeAdapter,
    collectedDomTreeFilePath,
    enzymeMountAdapterFilePath,
    jestBinaryPath,
    reactVersion,
}: {
    filePath: string;
    enzymeImportsPresent: boolean;
    filePathWithEnzymeAdapter: string;
    collectedDomTreeFilePath: string;
    enzymeMountAdapterFilePath: string;
    jestBinaryPath: string;
    reactVersion: number;
}): Promise<string> => {
```
6. `generateInitialPrompt` - Generate a prompt for an LLM to assist in converting Enzyme test cases to RTL.
```ts
export const generateInitialPrompt = ({
    filePath,
    getByTestIdAttribute,
    astCodemodOutput,
    renderedCompCode,
    originalTestCaseNum,
    extendPrompt,
}: {
    filePath: string;
    getByTestIdAttribute: string;
    astCodemodOutput: string;
    renderedCompCode: string;
    originalTestCaseNum: number;
    extendPrompt?: string[];
}): string => {
```
7. `generateFeedbackPrompt` - Generate a feedback prompt for an LLM to assist in fixing React unit tests using RTL.
```ts
export const generateFeedbackPrompt = ({
    rtlConvertedFilePathAttmpt1,
    getByTestIdAttribute,
    jestRunLogsFilePathAttmp1,
    renderedCompCode,
    originalTestCaseNum,
    extendPrompt,
}: {
    rtlConvertedFilePathAttmpt1: string;
    getByTestIdAttribute: string;
    jestRunLogsFilePathAttmp1: string;
    renderedCompCode: string;
    originalTestCaseNum: number;
    extendPrompt?: string[];
}): string => {
```
8. `extractCodeContentToFile` - Extract code content from an LLM response and write it to a file.
```ts
export const extractCodeContentToFile = ({
    LLMresponse,
    rtlConvertedFilePath,
}: {
    LLMresponse: string;
    rtlConvertedFilePath: string;
}): string => {
```
9. `runTestAndAnalyze` - Run an RTL test file with Jest and analyze the results.
```ts
export const runTestAndAnalyze = async ({
    filePath,
    writeResults = true,
    jestBinaryPath,
    jestRunLogsPath,
    rtlConvertedFilePath,
    outputResultsPath,
    originalTestCaseNum,
    summaryFile,
    attempt,
}: {
    filePath: string;
    writeResults?: boolean;
    jestBinaryPath: string;
    jestRunLogsPath: string;
    rtlConvertedFilePath: string;
    outputResultsPath: string;
    originalTestCaseNum: number;
    summaryFile: string;
    attempt: keyof TestResult;
}): Promise<TestResult> => {
```
