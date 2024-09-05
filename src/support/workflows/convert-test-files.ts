import fs from 'fs';
import { initializeConfig, Config } from '../config/config';
import { convertWithAST } from '../ast-transformations/run-ast-transformations';
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
    [filePath: string]: TestResult;
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
        const initialPrompt = generateInitialPrompt({
            filePath,
            getByTestIdAttribute: config.testId,
            astCodemodOutput: astConvertedCode,
            renderedCompCode: reactCompDom,
            originalTestCaseNum: config.originalTestCaseNum,
            extendPrompt: extendInitialPrompt,
        });

        // Call the API with a custom LLM method
        const LLMresponseAttmp1 = await llmCallFunction(initialPrompt);

        // Extract generated code
        const convertedFilePath = extractCodeContentToFile({
            LLMresponse: LLMresponseAttmp1,
            rtlConvertedFilePath: config.rtlConvertedFilePathAttmp1,
        });

        // Run the file and analyze the failures
        const attempt1Result = await runTestAndAnalyze({
            filePath: convertedFilePath,
            writeResults: false,
            jestBinaryPath: config.jestBinaryPath,
            jestRunLogsPath: config.jestRunLogsFilePathAttmp1,
            rtlConvertedFilePath: config.rtlConvertedFilePathAttmp1,
            outputResultsPath: config.outputResultsPath,
            originalTestCaseNum: config.originalTestCaseNum,
            summaryFile: config.jsonSummaryPath,
            attempt: 'attempt1',
        });

        // Store the result in the totalResults object
        const filePathClean = `${filePath.replace(/[<>:"/|?*.]+/g, '-')}`;
        totalResults[filePathClean] = {
            attempt1: attempt1Result.attempt1, // Store attempt1
            // Initialize attempt2 with default values
            attempt2: {
                testPass: null,
                failedTests: 0,
                passedTests: 0,
                totalTests: 0,
                successRate: 0,
            },
        };

        // If feedback step is enabled and attempt 1 failed
        if (
            enableFeedbackStep &&
            !totalResults[filePathClean].attempt1.testPass
        ) {
            // Create feedback command
            const feedbackPrompt = generateFeedbackPrompt({
                rtlConvertedFilePathAttmpt1: config.rtlConvertedFilePathAttmp1,
                getByTestIdAttribute: config.testId,
                jestRunLogsFilePathAttmp1: config.jestRunLogsFilePathAttmp1,
                renderedCompCode: reactCompDom,
                originalTestCaseNum: config.originalTestCaseNum,
                extendPrompt: extendFeedbackPrompt,
            });

            // Call the API with a custom LLM method
            const LLMresponseAttmp2 = await llmCallFunction(feedbackPrompt);

            // Extract generated code
            const convertedFeedbackFilePath = extractCodeContentToFile({
                LLMresponse: LLMresponseAttmp2,
                rtlConvertedFilePath: config.rtlConvertedFilePathAttmp2,
            });

            // Run the file and analyze the failures
            const attempt2Result = await runTestAndAnalyze({
                filePath: convertedFeedbackFilePath,
                writeResults: false,
                jestBinaryPath: config.jestBinaryPath,
                jestRunLogsPath: config.jestRunLogsFilePathAttmp2,
                rtlConvertedFilePath: config.rtlConvertedFilePathAttmp2,
                outputResultsPath: config.outputResultsPath,
                originalTestCaseNum: config.originalTestCaseNum,
                summaryFile: config.jsonSummaryPath,
                attempt: 'attempt2',
            });

            // Store the result for attempt2 in the totalResults object
            totalResults[filePathClean].attempt2 = attempt2Result.attempt2;
        }
    }

    // Write summary to outputResultsPath
    const generatedSummary = generateSummaryJson(totalResults);
    const finalSummaryJson = JSON.stringify(generatedSummary, null, 2);
    fs.writeFileSync(config.jsonSummaryPath, finalSummaryJson, 'utf-8');

    return generatedSummary;
};
