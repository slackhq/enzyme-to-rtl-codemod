import fs from 'fs';
import { converWithAST } from '../ast-transformations/run-ast-transformations';
import { getReactCompDom } from '../enzyme-helper/get-dom-enzyme';
import {
    generateInitialPrompt,
    generateFeedbackPrompt,
} from '../prompt-generation/generate-prompt';
import { extractCodeContentToFile } from '../code-extractor/extract-code';
import {
    runTestAndAnalyze,
    TestResult,
} from '../enzyme-helper/run-test-analysis';
import {
    setJestBinaryPath,
    setOutputResultsPath,
    configureLogLevel,
    getConfigProperty,
} from '../config/config';
import {
    generateSummaryJson,
    SummaryJson,
} from './utils/generate-result-summary';

// Define the function type for LLM call
export type LLMCallFunction = (prompt: string) => Promise<string>;

export interface TestResults {
    [filePath: string]: {
        attempt1: TestResult;
        attempt2: TestResult;
    };
}

/**
 * Converts test files and processes them using the specified parameters.
 *
 * This function takes an array of test file paths and performs a series of operations
 * including setting up the Jest environment, setting up configurations, and output paths.
 * It also utilizes an LLM (Large Language Model) call function to process the test files.
 * The results of the conversion are stored in the specified output directory.
 */
export const convertTestFiles = async ({
    filePaths,
    logLevel,
    jestBinaryPath,
    outputResultsPath,
    testId,
    llmCallFunction,
    extendInitialPrompt,
    extendFeedbackPrompt,
}: {
    filePaths: string[];
    logLevel?: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    llmCallFunction: LLMCallFunction;
    extendInitialPrompt?: string[];
    extendFeedbackPrompt?: string[];
}): Promise<SummaryJson> => {
    // Set log level
    if (logLevel) {
        configureLogLevel(logLevel);
    }

    // Set host project jest bin path
    setJestBinaryPath(jestBinaryPath);

    // Set host project results output path
    setOutputResultsPath(outputResultsPath);

    // Initialize total results object to collect results
    const totalResults: TestResults = {};

    for (const filePath of filePaths) {
        // Get AST conversion
        const astConvertedCode = converWithAST(filePath, testId);

        // Get React Component DOM tree for each test case
        const reactCompDom = await getReactCompDom(filePath);

        // Generate the prompt
        const prompt = generateInitialPrompt(
            filePath,
            'data-test',
            astConvertedCode,
            reactCompDom,
            extendInitialPrompt,
        );

        // Call the API with a custom LLM method
        const LLMResponse = await llmCallFunction(prompt);

        // Extract generated code
        const convertedFilePath = extractCodeContentToFile(LLMResponse);

        // Run the file and analyze the failures
        const attempt1Result = await runTestAndAnalyze(
            convertedFilePath,
            false,
        );

        // Store the result in the totalResults object
        const filePathClean = `${filePath.replace(/[<>:"/|?*.]+/g, '-')}`;
        totalResults[filePathClean]['attempt1'] = attempt1Result;

        // Feedback step
        if (!attempt1Result.testPass) {
            // Generate feedback the prompt
            const feedbackPrompt = generateFeedbackPrompt(
                filePath,
                'data-test',
                astConvertedCode,
                reactCompDom,
                extendInitialPrompt,
            );

            // Call the API with a custom LLM method
            const feedbackLLMResponse = await llmCallFunction(feedbackPrompt);

            // Extract generated code
            // don't hardcode the filePath to write the file to
            const convertedFilePath =
                extractCodeContentToFile(feedbackLLMResponse);

            // Run the file and analyze the failures
            const attempt1Result = await runTestAndAnalyze(
                convertedFilePath,
                false,
            );
        }
    }

    // Write summary to outputResultsPath
    const generatedSummary = generateSummaryJson(totalResults);
    const finalSummaryJson = JSON.stringify(generatedSummary, null, 2);
    const resultFilePath = `${getConfigProperty('outputResultsPath')}/summary.json`;
    fs.writeFileSync(resultFilePath, finalSummaryJson, 'utf-8');

    return generatedSummary;
};
