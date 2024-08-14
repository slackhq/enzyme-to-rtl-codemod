# Enzyme to RTL codemod
This package is designed to help with automated conversion of jest tests from Enzyme to RTL. It's intended to be used with your version of the LLM.

# Requirements 
1. Jest
    1. This package depends on your host project jest binary and configuration. See API/Usage for more info how to set it up
2. Enzyme
    1. This package depends on your host project Enzyme version
3. Jscodeshift
    1. Installed as part of this package
4. LLM support
    1. You will need to call LLM with our generated prompt
    2. You will need to implement it yourself with your available LLM model
    3. LLM is instructed to return code in certain xml tags, that allows extracting that code for any model

# How to install
1. Install the package
```bash
npm install package-name-from-npm
```
or
``` bash
yarn add package-name-from-npm
```
# API/Usage
This package exports the following:
1. `setLogLevel` - set log level. Winston logging levels, see: https://github.com/winstonjs/winston#logging
```ts
configureLogLevel('verbose');
```
2. `setJestBinaryPath` - set the path to the executable binary for jest, e.g. `npm jest` or `yarn jest`
```ts
setJestBinaryPath('yarn jest');
```
3. `setOutputResultsPath` - filepath to output all the generated files in your host project
```ts
setOutputResultsPath('<path_to_results_folder>');
```
4. `converWithAST` - run AST conversions/annotations
```ts
const astConverted = await converWithAST(filePath);
```
5. `getReactComponentDOM` - collect DOM tree for each test case in your file
```ts
const reactCompDom = await getReactComponentDOM(filePath);
```
6. `generatePrompt` - generate prompt with all the necessary info
```ts
const prompt = await generatePrompt(filePath, 'data-qa', astConverted, reactCompDom);
```
7. `extractCodeContent` - extract code from the LLM response
```ts
const convertedFilePath = extractCodeContent(LLMResponse);
```
8. `runTestAndAnalyze` - run the converted test file and analyze the logs
```ts
await runTestAndAnalyze(convertedFilePath);
```

# Output results
1. ast-transformed-file.jest.tsx - AST converted/annotated file
2. enzyme-mount-overwrite.jest.tsx - Your file with overwritten Enzyme rendering methods that emit DOM for test cases 
3. enzyme-render-adapter.ts - Enzyme rendering methods with DOM logs collection logic
4. rtl-converted-file.jest.tsx - Converted RTL file
5. test-cases-dom-tree.csv - CSV with DOM tree for each test case
6. jest-test-run-logs.md - Jest run logs for your RTL file

# NOTE:
1. This package will only work if your test files use Enzyme `mount` and `shallow` imported directly from Enzyme package. If you use helper methods to mount the components it will not work
```ts
import { mount } from 'enzyme';
```
2. This package works only with jest, no other test runners have been tested
3. `enzyme-mount-adapter.js` is a Javascript file to enable this for project that do not use Typescript

## Example
```ts
// Import all the necessary methods
import {
	setJestBinaryPath,
	setOutputResultsPath,
	converWithAST,
	getReactComponentDOM,
	generatePrompt,
	extractCodeContent,
	runTestAndAnalyze,
	configureLogLevel,
} from 'package-name-from-npm';
// Import a helper method to call your LLM
import { callClaudeLLM } from './llm-helper/llm-helper';

// Create an async function to execute the flow
async function convertTestFile(filePath: string) {
	// Set log level to verbose
	configureLogLevel('verbose');

	// Set host project jest bin path
	setJestBinaryPath('yarn jest');

	// Set host project results output path
	setOutputResultsPath('js/modern/test-utils/ai-package-testing/temp');

	// Get AST conversion
	const astConverted = await converWithAST(filePath);

	// Get React Component DOM tree for each test case
	const reactCompDom = await getReactComponentDOM(filePath);

	// Generate the prompt
	const prompt = await generatePrompt(filePath, 'data-qa', astConverted, reactCompDom);

	/**
	 * Call LLM
	 * 1. This would be specific for every project
	 * 2. We only add tooling for context gathering and prompt generation
     * 3. LLM is instructed to return the converted code in xml tags, which should work with any LLM model
	 */
	// Create Claude specific prompt, make a request, get response
	const LLMResponse = await callClaudeLLM(prompt);

	// Extract generated code
	const convertedFilePath = extractCodeContent(LLMResponse);

	// Run the file and analyze the failures
	await runTestAndAnalyze(convertedFilePath);
}

// Call the function
convertTestFile(
	'<your_enzyme_file>',
);
```

# Debugging
1. By default log level is `info`
2. Set the log level to `verbose` by importing and setting `setLogLevel('verbose')`


# Testing:
## locally:
1. bump the version in package.json
1. comment out /dist in npmignore
1. `npm run build`
1. `npm pack`
1. install in your host project with `npm install <path_to_tar_file>`