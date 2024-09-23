# Enzyme to RTL codemod

This package automates the conversion of Jest tests from Enzyme to React Testing Library (RTL). It is designed to be used with your own large language model (LLM) and your implementation for programmatically making API requests to retrieve LLM responses based on the prompts generated by this tool.

# Note

In response to numerous requests from external developers, we are open-sourcing a version of our Slack-built tool for converting Enzyme tests to React Testing Library (RTL). While this tool is not a complete solution for all use cases, it serves as a starting point for automating the migration process. With over 1.5 million Enzyme downloads from npm (as of September 2024), our goal is to ease this transition, save time, and demonstrate a practical application of LLM integration in developer workflows.

We hope this tool proves useful. We encourage contributions to this repository or forking it to make necessary adjustments. We will provide limited support for reviewing critical bug fixes.

# Requirements

1. Jest: This package relies on your host project's Jest binary and configuration. Refer to the API/Usage section for more details.
2. Enzyme: The package depends on the version of Enzyme used in your host project.
3. Jscodeshift: Included as part of this package.
4. LLM Support:
    1. You need to integrate an LLM to process the generated prompts.
    2. The LLM implementation is your responsibility, using the model available to you.
    3. LLM is instructed to return converted code in certain xml tags in the prompt, which should make it compatible with any LLM model

# How to install (in progress)

```bash
npm install @slack/enzyme-to-rtl-codemod
```

or

```bash
yarn add @slack/enzyme-to-rtl-codemod
```

# API/Usage

There are three ways to use this package:

1. Using a single workflow function `convertTestFiles({...})`
2. Using many individual functions with more control over the flow
3. CLI (currently not implemented)

## 1. Running the conversion flow for one or more files with one method using the `convertTestFiles()` function:

```ts
// Import convertTestFiles and LLMCallFunction type
import {
    convertTestFiles,
    type LLMCallFunction,
} from '@slack/enzyme-to-rtl-codemod';

// Example implementation of the LLM call function
const callLLMFunctionExample: LLMCallFunction = async (
    prompt: string,
): Promise<string> => {
    // Step 1: Configure LLM parameters
    const config = {
        // Add your LLM configuration parameters here
        // Lowering the temperature (e.g., to 0.2) may yield more deterministic results
    };

    // Step 2: Call the LLM with the provided prompt
    const LLLresponse = await callLLMapi(config, prompt);

    // Step 3: Return the result
    return LLLresponse;
};

// Implement convertTestFiles function call with your arguments
const convertFiles = async (filePaths: string[]) => {
    const results = await convertTestFiles({
        filePaths: filePaths,
        jestBinaryPath: 'npx jest',
        outputResultsPath: 'ai-conversion-testing/temp',
        testId: 'data-test',
        llmCallFunction: callLLMFunctionExample,
        enableFeedbackStep: true,
    });

    console.log('Results:', results);
};

const enzymeFilePaths = [
    'path/to/your/enzymeFile1.jest.tsx',
    'path/to/your/enzymeFile2.jest.tsx',
];

// Run the function and check logs and outputResultsPath for results
convertFiles(enzymeFilePaths);
```

## 2. Running the conversion flow with individual methods for one file:

This approach gives you more control over the flow and allows you to inspect the output of each method. You may also want to extract only the AST-converted code.
Important: The methods must be called in the correct order, as the flow depends on it.

```ts
// Import the required methods
import {
    initializeConfig,
    convertWithAST,
    getReactCompDom,
    generateInitialPrompt,
    extractCodeContentToFile,
    runTestAndAnalyze,
    generateFeedbackPrompt,
} from '@slack/enzyme-to-rtl-codemod';
// Import the LLM api call method helper
import { callLLM } from './llm-helper';

const convertTestFile = async (filePath: string): Promise<void> => {
    // Initialize config
    const config = initializeConfig({
        filePath,
        jestBinaryPath: 'npx jest',
        outputResultsPath: 'ai-conversion-testing/temp',
        testId: 'data-test',
    });

    // Perform AST conversion
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

    // Generate the initial LLM prompt
    const initialPrompt = generateInitialPrompt({
        filePath,
        getByTestIdAttribute: config.testId,
        astCodemodOutput: astConvertedCode,
        renderedCompCode: reactCompDom,
        originalTestCaseNum: config.originalTestCaseNum,
    });

    /**
     * Call LLM with the generated prompt
     * 1. This would be specific for your LLM
     * 2. We only provide tooling for context gathering and prompt generation
     * 3. The prompt string should be LLM agnostic
     */
    // Create a prompt, make a request, get a response
    const LLMresponse = await callLLM(initialPrompt);

    // Extract the generated code
    const convertedFilePath = extractCodeContentToFile({
        LLMresponse,
        rtlConvertedFilePath: config.rtlConvertedFilePathAttmp1,
    });

    // Run the converted test file and analyze the results
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
            attempt: 'attempt2',
        });
        // Update finalResult to include attempt2Result
        finalResult = attempt2Result;
    }

    // Output final result
    console.log('final result:', finalResult);
};

// Run the function and see logs and files in `outputResultsPath`
convertTestFile('<testPath1>');
```

## 3. Run conversion flow with cli and config for one file or more files:

### TODO

# Output results

Results will be written to the `outputResultsPath/<timeStampFolder>/<filePath>/*` folder.
Example:

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

1. This package will only work if your test files use Enzyme `mount` and `shallow` imported directly from the Enzyme package. If your project uses helper methods to wrap Enzyme’s mount or shallow, this package may not work as expected.

```ts
import { mount } from 'enzyme';
```

2. This package works only with jest, no other test runners have been tested

# Debugging

1. By default log level is `info`
2. Set the log level to `verbose` in `convertFiles` or `initializeConfig`

## Exported methods

This package exports the following:

1. `convertTestFiles` - run the entire conversion flow in one function. Easy and fast way to start converting
2. `LLMCallFunction` - llm call function type
3. `initializeConfig` - Initialize configuration settings required for the conversion process. This method prepares paths and settings, such as Jest binary, output paths, and test identifiers.
4. `convertWithAST` - Run jscodeshift and make AST conversions/annotations.
5. `getReactCompDom` - Get React component DOM for test cases.
6. `generateInitialPrompt` - Generate a prompt for an LLM to assist in converting Enzyme test cases to RTL.
7. `generateFeedbackPrompt` - Generate a feedback prompt for an LLM to assist in fixing React unit tests using RTL.
8. `extractCodeContentToFile` - Extract code content from an LLM response and write it to a file.
9. `runTestAndAnalyze` - Run an RTL test file with Jest and analyze the results.
