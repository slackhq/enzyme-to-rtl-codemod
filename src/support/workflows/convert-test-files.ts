import fs from 'fs';
import { initializeConfig, Config } from '../config/config';
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
    generateSummaryJson,
    SummaryJson,
} from './utils/generate-result-summary';

// Define the function type for LLM call
export type LLMCallFunction = (prompt: string) => Promise<string>;

export interface TestResults {
    [filePath: string]: {
        attempt1: TestResult;
        attempt2?: TestResult;
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
    // Initialize total results object to collect results
    const totalResults: TestResults = {};

    // Initialize config
    let config = {} as Config;

    for (const filePath of filePaths) {
        try {
            // Initialize config
            config = initializeConfig({
                filePath,
                logLevel,
                jestBinaryPath,
                outputResultsPath,
                testId,
            });
        } catch (error) {
            console.error(
                `Failed to initialize config for file: ${filePath}`,
                error,
            );
            continue;
        }

        // Get AST conversion
        const astConvertedCode = converWithAST(
            filePath,
            config.testId,
            config.astTranformedFilePath,
        );

        // Get React Component DOM tree for each test case
        const reactCompDom = await getReactCompDom(
            filePath,
            config.enzymeImportsPresent,
            config.filePathWithEnzymeAdapter,
            config.collectedDomTreeFilePath,
            config.enzymeMountAdapterFilePath,
            config.jestBinaryPath,
            config.reactVersion,
        );

        // Generate the prompt
        const initialPrompt = generateInitialPrompt(
            filePath,
            config.testId,
            astConvertedCode,
            reactCompDom,
            config.originalTestCaseNum,
            extendInitialPrompt,
        );

        // Call the API with a custom LLM method
        const LLMResponse = await llmCallFunction(initialPrompt);

        // Extract generated code
        const convertedFilePath = extractCodeContentToFile(
            LLMResponse,
            config.rtlConvertedFilePathAttmp1,
        );

        // Run the file and analyze the failures
        const attempt1Result = await runTestAndAnalyze(
            convertedFilePath,
            false,
            config.jestBinaryPath,
            config.jestRunLogsFilePathAttmp1,
            config.rtlConvertedFilePathAttmp1,
            config.outputResultsPath,
            config.originalTestCaseNum,
            config.jsonSummaryPath,
        );

        // Store the result in the totalResults object
        const filePathClean = `${filePath.replace(/[<>:"/|?*.]+/g, '-')}`;
        totalResults[filePathClean] = { attempt1: attempt1Result };

        // If feedback step is enabled and attempt 1 failed
        if (
            enableFeedbackStep &&
            !totalResults[filePathClean].attempt1.testPass
        ) {
            // Create feedback command
            const feedbackPrompt = generateFeedbackPrompt(
                config.rtlConvertedFilePathAttmp1,
                config.testId,
                config.jestRunLogsFilePathAttmp1,
                reactCompDom,
                config.originalTestCaseNum,
                extendFeedbackPrompt,
            );

            // Call the API with a custom LLM method
            const feedbackLLMResponse = await llmCallFunction(feedbackPrompt);

            // Extract generated code
            const convertedFeedbackFilePath = extractCodeContentToFile(
                feedbackLLMResponse,
                config.rtlConvertedFilePathAttmp2,
            );

            // Run the file and analyze the failures
            const attempt2Result = await runTestAndAnalyze(
                convertedFeedbackFilePath,
                false,
                config.jestBinaryPath,
                config.jestRunLogsFilePathAttmp2,
                config.rtlConvertedFilePathAttmp2,
                config.outputResultsPath,
                config.originalTestCaseNum,
                config.jsonSummaryPath,
            );

            // Store the result in the totalResults object
            totalResults[filePathClean].attempt2 = attempt2Result;
        }
    }

    // Write summary to outputResultsPath
    const generatedSummary = generateSummaryJson(totalResults);
    const finalSummaryJson = JSON.stringify(generatedSummary, null, 2);
    fs.writeFileSync(config.jsonSummaryPath, finalSummaryJson, 'utf-8');

    return generatedSummary;
};
