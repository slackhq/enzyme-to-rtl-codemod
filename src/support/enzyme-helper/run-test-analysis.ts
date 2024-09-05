import { runCommand } from '../shell-helper/shell-helper';
import { countTestCases } from '../config/utils/utils';
import fs from 'fs';
import { createCustomLogger } from '../logger/logger';

export const testAnalysisLogger = createCustomLogger('Test Analysis');

export interface TestResult {
    testPass: boolean | null;
    failedTests: number;
    passedTests: number;
    totalTests: number;
    successRate: number;
}

export interface TestResultNew {
    'attempt1': {
        testPass: boolean | null;
        failedTests: number;
        passedTests: number;
        totalTests: number;
        successRate: number;
    },
    'attempt2': {
        testPass: boolean | null;
        failedTests: number;
        passedTests: number;
        totalTests: number;
        successRate: number;
    },
}
export interface TestResults {
    failedTests: number;
    passedTests: number;
    totalTests: number;
    successRate: number;
}

/**
 * Run an RTL test file with Jest and analyze the results.
 *
 * This function executes a Jest test for a given file, logs the output, and performs
 * an analysis of the test results. It also checks whether the number of test cases
 * in the converted file matches the original and writes a summary of the results.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.filePath - The path to the test file to be executed.
 * @param {boolean} [params.writeResults=true] - Flag indicating whether to write the results to a summary file.
 * @param {string} params.jestBinaryPath - The path to the Jest binary.
 * @param {string} params.jestRunLogsPath - The file path where Jest run logs will be saved.
 * @param {string} params.rtlConvertedFilePath - The path to the converted React Testing Library test file.
 * @param {string} params.outputResultsPath - The path where results will be saved.
 * @param {number} params.originalTestCaseNum - The number of test cases in the original test file.
 * @param {string} params.summaryFile - The file path where the test result summary will be saved.
 * @returns {Promise<TestResult>} The test result, including pass/fail status, number of passed/failed tests, total tests, and success rate.
 */
export const runTestAndAnalyze = async ({
    filePath,
    writeResults = true,
    jestBinaryPath,
    jestRunLogsPath,
    rtlConvertedFilePath,
    outputResultsPath,
    originalTestCaseNum,
    summaryFile,
}: {
    filePath: string;
    writeResults?: boolean;
    jestBinaryPath: string;
    jestRunLogsPath: string;
    rtlConvertedFilePath: string;
    outputResultsPath: string;
    originalTestCaseNum: number;
    summaryFile: string;
}): Promise<TestResult> => {
    testAnalysisLogger.info('Start: Run RTL test and analyze results');

    const result: TestResult = {
        testPass: null,
        failedTests: 0,
        passedTests: 0,
        totalTests: 0,
        successRate: 0,
    };

    // Create jest run command for the test file
    const rtlRunCommand = `${jestBinaryPath} ${filePath}`;
    testAnalysisLogger.verbose('Run converted tests');
    const generatedFileRunShellProcess = await runCommand(rtlRunCommand);

    // Collect test run logs
    testAnalysisLogger.verbose('Clean output');
    const testrunLogs = removeANSIEscapeCodes(
        generatedFileRunShellProcess.output +
            generatedFileRunShellProcess.stderr,
    );

    // Write logs to a file
    testAnalysisLogger.verbose(`Write jest run logs to ${jestRunLogsPath}`);
    fs.writeFileSync(jestRunLogsPath, testrunLogs, 'utf-8');

    // Analyze logs for errors
    testAnalysisLogger.verbose('Analyze logs for errors');
    result.testPass = analyzeLogsForErrors(testrunLogs);

    if (!result.testPass) {
        testAnalysisLogger.info('Test failed');
        testAnalysisLogger.info(
            `Converted RTL file path: ${rtlConvertedFilePath}`,
        );
        testAnalysisLogger.info(`Jest run logs file path: ${jestRunLogsPath}`);
        testAnalysisLogger.info(`See ${outputResultsPath} for more info`);
    } else {
        testAnalysisLogger.info('Test passed!');
        testAnalysisLogger.info(
            `Converted RTL file path: ${rtlConvertedFilePath}`,
        );
        testAnalysisLogger.info(`Jest run logs file path: ${jestRunLogsPath}`);

        // Check if converted file has the same number of tests as original
        const convertedTestCaseNum = countTestCases(rtlConvertedFilePath);
        if (convertedTestCaseNum < originalTestCaseNum) {
            testAnalysisLogger.warn(
                `Generated file has fewer test cases (${convertedTestCaseNum}) than original (${originalTestCaseNum})`,
            );
        }
    }
    testAnalysisLogger.info('Extracting test results');
    const detailedResult = extractTestResults(testrunLogs);
    // Merge detailedResult into the result object
    result.failedTests = detailedResult.failedTests;
    result.passedTests = detailedResult.passedTests;
    result.totalTests = detailedResult.totalTests;
    result.successRate = detailedResult.successRate;

    testAnalysisLogger.info(
        `Detailed result: ${JSON.stringify(detailedResult)}`,
    );

    // Write results
    if (writeResults) {
        testAnalysisLogger.info(`Writing final result to ${summaryFile}`);
        const jsonResult = JSON.stringify(result, null, 2);
        fs.writeFileSync(summaryFile, jsonResult, 'utf-8');
    }

    testAnalysisLogger.info('Done: Run RTL test and analyze results');

    return result;
};

/**
 * Remove ANSI escape codes from output
 * @param input
 * @returns
 */
export const removeANSIEscapeCodes = (input: string): string => {
    // Regular expression to match ANSI escape codes
    testAnalysisLogger.verbose('Cleaning up from ansi escape codes');
    // eslint-disable-next-line no-control-regex
    const ansiEscapeCodeRegex = /\u001b\[[0-9;]*m/g;
    // Remove ANSI escape codes from the input string
    return input.replace(ansiEscapeCodeRegex, '');
};

/**
 * Check if the jest run log has failed test cases
 * @param jestRunLogs
 * @returns
 */
export const analyzeLogsForErrors = (jestRunLogs: string): boolean => {
    testAnalysisLogger.verbose('Start: Analyze logs for errors');
    // Find errors in logs
    if (
        !jestRunLogs ||
        jestRunLogs.includes('FAIL') ||
        jestRunLogs.includes('No tests found') ||
        jestRunLogs.includes('Not run') ||
        jestRunLogs.includes('FATAL ERROR')
    ) {
        testAnalysisLogger.verbose('Done: Analyze logs for errors');
        return false;
    } else {
        testAnalysisLogger.verbose('Done: Analyze logs for errors');
        return true;
    }
};

/**
 * Extract details from jest run logs
 * @param jestRunLogs
 * @returns
 */
export const extractTestResults = (jestRunLogs: string): TestResults => {
    const detailedResult: TestResults = {
        failedTests: 0,
        passedTests: 0,
        totalTests: 0,
        successRate: 0,
    };

    const pattern =
        /Tests:\s*(?:(\d+) failed, )?(?:(\d+) skipped, )?(?:(\d+) passed, )?(\d+) total/;
    const match = jestRunLogs.match(pattern);

    if (match) {
        const [, failed = 0, , passed = 0, total = 0] = match.map(Number);

        // Update the detailedResult object if matched
        detailedResult.failedTests = failed || 0; // if failed is NaN
        detailedResult.passedTests = passed || 0; // if passed is NaN
        detailedResult.totalTests = total;
        detailedResult.successRate = (passed / total) * 100 || 0;
    } else {
        testAnalysisLogger.verbose(
            'Results were not parsed. Defaulting to 0...',
        );
    }
    return detailedResult;
};
