# Enzyme to RTL codemod
This package is designed to help with automated conversion of jest tests from Enzyme to RTL. It's intended to be used with your version of the LLM.

# Requirements 
1. Jest: This package depends on your host project jest binary and configuration. See API/Usage for more info how to set it up
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

## 1. Run conversion flow for one or more files in one method in a script:
1. Import convertTestFiles
```ts
export declare const convertTestFiles: ({ filePaths, logLevel, jestBinaryPath, outputResultsPath, testId, llmCallFunction, extendPrompt, }: {
    filePaths: string[];
    logLevel?: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    llmCallFunction: LLMCallFunction;
    extendPrompt?: string[];
}) => Promise<SummaryJson>;
```
2. Example
```ts
// Import convertTestFiles that accepts an array of Enzyme files, LLMCallFunction and SummaryJson types
import { convertTestFiles, LLMCallFunction, SummaryJson } from '@slack/enzyme-to-rtl-codemod';

// Example implementation of the LLM call function
const callLLMFunctionExample: LLMCallFunction = async (prompt: string): Promise<string> => {
    // Step 1: Configure LLM parameters
    const config = {
        // Add your LLM configuration parameters here
        // Consider lowering the temperature (0.2) for more deterministic results
    };

    // Step 2: Call the LLM with the provided prompt
    const response = await someLLMAPI.call(config, prompt);

    // Step 3: Process the response and return the result
    // Adjust according to the API response structure
    return response.data.text; 
};

// Call the async method, see logs and files in `outputResultsPath`
(async function convertTests(filePaths: string[]) {
	const results: SummaryJson = await convertTestFiles({
		filePaths: filePaths,
		logLevel: 'verbose',
		jestBinaryPath: 'npx jest',
		outputResultsPath: 'ai-conversion-testing/temp',
		testId: 'data-test',
		llmCallFunction: callLLMFunctionExample,
		extendPrompt: ['convert this to that', 'add myStore to <Provider> like this <Provider store=(myStore)>Component</Provider>']
	});
    console.log('results:', results);
})([
	'<testPath1>',
	'<testPath2>'
]);
```

## 2. Run conversion flow with individual methods for one file in a script:
This approach gives you more control of the flow and ability to inspect the output of each method.
The order of methods used must be respected, as the flow depends on it
1. Import all the individual methods. See Exported methods section for more info on each method
```ts
// Import all the methods
import {
	setJestBinaryPath,
	setOutputResultsPath,
	convertWithAST,
	getReactCompDom,
	generatePrompt,
	extractCodeContentToFile,
	runTestAndAnalyze,
    TestResult,
	configureLogLevel,
} from '@slack/enzyme-to-rtl-codemod';
// Import llm call method helper
import { callLLM } from './llm-helper';

const convertTestFile = async (filePath: string): Promise<void> => {
    // Set log level to verbose
    configureLogLevel('verbose');

    // Set host project jest bin path
    setJestBinaryPath('npx jest');

    // Set host project results output path
    setOutputResultsPath('ai-conversion-testing/temp');

    // Get AST conversion
    const astConvertedCode = convertWithAST(filePath, 'data-test');

    // Get React Component DOM tree for each test case
    const reactCompDom = await getReactCompDom(filePath);

    // Generate the prompt
    const prompt = generatePrompt(filePath, 'data-test', astConvertedCode, reactCompDom);

    /**
     * Call LLM with the generated prompt
     * 1. This would be specific for every project
     * 2. We only add tooling for context gathering and prompt generation
     * 3. It should be LLM model agnostic due to the prompt instructions (not tested on)
     */
    // Create Claude specific prompt, make a request, get response
    const LLMResponse = await callLLM(prompt);

    // Extract generated code
    const convertedFilePath = extractCodeContentToFile(LLMResponse);

    // Run the file and analyze the failures
    const result: TestResult = await runTestAndAnalyze(convertedFilePath);

    console.log('result:', result);
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
1. `configureLogLevel` - set log level. Winston logging levels, see: https://github.com/winstonjs/winston#logging. We used 'info' (default) and 'verbose'
```ts
configureLogLevel('verbose');
```
1. `setJestBinaryPath` - set the path to the executable binary for jest, e.g. `npm jest`, `yarn jest` or `npx jest` that would allow to run a single test with that command in your host project, e.g. `npm jest <SingeEnzymeFilePath>`
```ts
setJestBinaryPath('yarn jest');
```
1. `setOutputResultsPath` - filepath to output all the generated files in your host project
```ts
setOutputResultsPath('<path_to_results_folder>');
```
1. `convertWithAST` - run AST conversions/annotations
```ts
const astConverted = await convertWithAST(filePath);
```
1. `getReactComponentDOM` - collect DOM tree for each test case in your file
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
