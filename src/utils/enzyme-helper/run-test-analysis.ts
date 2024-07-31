import { runCommand } from '../shell-helper/shell-helper';
import { getConfigProperty } from '../config';
import { countTestCases } from '../prompt-generation/utils/utils';
import fs from 'fs';

// TODO: add logs
export interface RTLTestResult {
    testPass: boolean | null;
    testrunLogs: string;
}

interface TestResults {
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
    console.log('\nStart: Run RTL test and analyze results');

    const result: RTLTestResult = {
        testPass: null,
        testrunLogs: 'Not run',
    };

    // Create jest run command for the test file
    const rtlRunCommand = `${getConfigProperty('jestBinaryPath')} ${filePath}`;
    const generatedFileRunShellProcess = await runCommand(rtlRunCommand);

    // Collect test run logs
    result.testrunLogs = removeANSIEscapeCodes(
        generatedFileRunShellProcess.output +
            generatedFileRunShellProcess.stderr,
    );

    // Write logs to a file
    const jestRunLogsPath = getConfigProperty('jestRunLogsFilePath');
    fs.writeFileSync(jestRunLogsPath, result.testrunLogs, 'utf8');

    // Analyze logs for errors
    result.testPass = analyzeLogsForErrors(result);

    if (!result.testPass) {
        console.log('\nTest failed');
        console.log(
            'Converted RTL file path:',
            getConfigProperty('rtlConvertedFilePath'),
        );
        console.log(
            'Jest run logs file path:',
            getConfigProperty('jestRunLogsFilePath'),
        );
        console.log(
            `See ${getConfigProperty('outputResultsPath')} for more info`,
        );
    } else {
        // TODO: add check if the converted file has fewer tests
        console.log('\nTest passed!');
        console.log(
            'Converted RTL file path:',
            getConfigProperty('rtlConvertedFilePath'),
        );
        console.log(
            'Jest run logs file path:',
            getConfigProperty('jestRunLogsFilePath'),
        );
    }

    const detailedResult = extractTestResults(result.testrunLogs);
    console.log('\nDetailed result:', detailedResult);

    console.log('\nDone: Run RTL test and analyze results');
    return result;
};

/**
 * Remove ANSI escape codes from output
 * @param input
 * @returns
 */
export const removeANSIEscapeCodes = (input: string): string => {
    // Regular expression to match ANSI escape codes
    // eslint-disable-next-line no-control-regex
    const ansiEscapeCodeRegex = /\u001b\[[0-9;]*m/g;
    // Remove ANSI escape codes from the input string
    return input.replace(ansiEscapeCodeRegex, '');
};

/**
 * Check if the result has failed test cases
 * @param result
 * @returns
 */
const analyzeLogsForErrors = (result: RTLTestResult): boolean => {
    console.log('\nStart: Analyze logs for errors');
    // Find errors in logs
    if (
        result.testrunLogs.includes('FAIL modern') ||
        result.testrunLogs.includes('No tests found') ||
        result.testrunLogs.includes('Not run') ||
        result.testrunLogs.includes('FATAL ERROR')
    ) {
        console.log('Done: Analyze logs for errors');
        return false;
    } else {
        console.log('Done: Analyze logs for errors');
        return true;
    }
};

/**
 * Extract details from jest run logs
 * @param jestRunLogs
 * @returns
 */
const extractTestResults = (jestRunLogs: string): TestResults => {
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
        console.log('Results were not parsed. Defaulting to 0...');
    }
    return detailedResult;
};
