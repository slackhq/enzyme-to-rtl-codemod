import { TestResults } from '../convert-test-files';
import { TestResult } from '../../enzyme-helper/run-test-analysis';

export interface Summary {
    totalTests: number;
    totalSuccessRate: number;
    convertedAndPassed: number;
    convertedAndFailed: number;
}

export interface SummaryJson {
    summary: Summary;
    [filePath: string]: TestResult | Summary;
}

/**
 *
 * @param testResults
 * @returns
 */
export function generateSummaryJson(testResults: TestResults): SummaryJson {
    // Initialize summary variables
    let totalTests = 0;
    let totalSuccessRate = 0;
    let convertedAndPassed = 0;
    let convertedAndFailed = 0;

    // Iterate over the test results to calculate totals
    for (const filePath in testResults) {
        if (Object.prototype.hasOwnProperty.call(testResults, filePath)) {
            const { attempt1, attempt2 } = testResults[filePath];

            // Select the attempt with the higher success rate for calculations
            const bestAttempt =
                attempt2.testPass !== null &&
                attempt2.successRate > attempt1.successRate
                    ? attempt2
                    : attempt1;

            // Accumulate the totals based on the best attempt
            totalTests += bestAttempt.totalTests;
            totalSuccessRate +=
                (bestAttempt.successRate / 100) * bestAttempt.totalTests;
            convertedAndPassed += bestAttempt.passedTests;
            convertedAndFailed += bestAttempt.failedTests;
        }
    }

    // Handle the case where there are no tests to avoid division by zero
    totalSuccessRate =
        totalTests > 0 ? (totalSuccessRate / totalTests) * 100 : 0;

    // Create the summary object
    const summary: Summary = {
        totalTests,
        totalSuccessRate,
        convertedAndPassed,
        convertedAndFailed,
    };

    // Create the final JSON structure
    const summaryJson: SummaryJson = {
        summary,
        ...testResults, // Keep both attempt1 and attempt2 for each filePath
    };

    return summaryJson;
}
