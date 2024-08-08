import { runCommand } from '../shell-helper/shell-helper';
import { getConfigProperty } from '../config';
import { countTestCases } from '../prompt-generation/utils/utils';
import fs from 'fs';
import createCustomLogger from '../logger/logger';

export const testAnalysisLogger = createCustomLogger('Test Analysis');

export interface RTLTestResult {
    testPass: boolean | null;
    testrunLogs: string;
}

export interface TestResults {
    failedTests: number;
    passedTests: number;
    totalTests: number;
    successRate: number;
}

/**
 * Run RTL test file with jest
 * @param testFilePath
 * @returns
 */
export const runTestAndAnalyzeFile = async (
    filePath: string,
): Promise<RTLTestResult> => {
    testAnalysisLogger.info('Start: Run RTL test and analyze results');

    const result: RTLTestResult = {
        testPass: null,
        testrunLogs: 'Not run',
    };

    // Create jest run command for the test file
    const rtlRunCommand = `${getConfigProperty('jestBinaryPath')} ${filePath}`;
    testAnalysisLogger.verbose('Run converted tests');
    const generatedFileRunShellProcess = await runCommand(rtlRunCommand);

    // Collect test run logs
    testAnalysisLogger.verbose('Clean output');
    result.testrunLogs = removeANSIEscapeCodes(
        generatedFileRunShellProcess.output +
            generatedFileRunShellProcess.stderr,
    );

    // Write logs to a file
    const jestRunLogsPath = getConfigProperty('jestRunLogsFilePath');
    testAnalysisLogger.verbose(`Write jest run logs to ${jestRunLogsPath}`);
    fs.writeFileSync(jestRunLogsPath, result.testrunLogs, 'utf8');

    // Analyze logs for errors
    testAnalysisLogger.verbose('Analyze logs for errors');
    result.testPass = analyzeLogsForErrors(result.testrunLogs);

    if (!result.testPass) {
        testAnalysisLogger.info('Test failed');
        testAnalysisLogger.info(
            `Converted RTL file path: ${getConfigProperty('rtlConvertedFilePath')}`,
        );
        testAnalysisLogger.info(
            `Jest run logs file path: ${getConfigProperty('jestRunLogsFilePath')}`,
        );
        testAnalysisLogger.info(
            `See ${getConfigProperty('outputResultsPath')} for more info`,
        );
    } else {
        // TODO: add check if the converted file has fewer tests
        testAnalysisLogger.info('Test passed!');
        testAnalysisLogger.info(
            `Converted RTL file path: ${getConfigProperty('rtlConvertedFilePath')}`,
        );
        testAnalysisLogger.info(
            `Jest run logs file path: ${getConfigProperty('jestRunLogsFilePath')}`,
        );
    }
    testAnalysisLogger.info('Extracting test results');
    const detailedResult = extractTestResults(result.testrunLogs);
    testAnalysisLogger.info(`Detailed result: ${detailedResult}`);

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
        jestRunLogs.includes('FAIL modern') ||
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
        const [, failed = 0, _skipped = 0, passed = 0, total = 0] =
            match.map(Number);

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