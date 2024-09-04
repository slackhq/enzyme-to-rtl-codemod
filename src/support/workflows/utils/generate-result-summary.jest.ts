import {
    generateSummaryJson,
    SummaryJson,
    Summary,
} from './generate-result-summary';
import { TestResults } from '../convert-test-files';

describe('generateSummaryJson', () => {
    it('should correctly calculate summary with all passed tests using best attempts', () => {
        const testResults: TestResults = {
            'dummy-test-1': {
                attempt1: {
                    testPass: true,
                    failedTests: 0,
                    passedTests: 4,
                    totalTests: 4,
                    successRate: 100,
                },
                attempt2: {
                    testPass: true,
                    failedTests: 0,
                    passedTests: 4,
                    totalTests: 4,
                    successRate: 90,
                },
            },
            'dummy-test-2': {
                attempt1: {
                    testPass: true,
                    failedTests: 0,
                    passedTests: 3,
                    totalTests: 3,
                    successRate: 100,
                },
                attempt2: {
                    testPass: true,
                    failedTests: 0,
                    passedTests: 3,
                    totalTests: 3,
                    successRate: 95,
                },
            },
        };

        const expectedSummary: Summary = {
            totalTests: 7,
            totalSuccessRate: 100,
            convertedAndPassed: 7,
            convertedAndFailed: 0,
        };

        const result: SummaryJson = generateSummaryJson(testResults);

        expect(result.summary).toEqual(expectedSummary);
        expect(result['dummy-test-1']).toEqual(testResults['dummy-test-1']);
        expect(result['dummy-test-2']).toEqual(testResults['dummy-test-2']);
    });

    it('should correctly calculate summary with some failed tests using best attempts', () => {
        const testResults: TestResults = {
            'dummy-test-1': {
                attempt1: {
                    testPass: false,
                    failedTests: 2,
                    passedTests: 2,
                    totalTests: 4,
                    successRate: 50,
                },
                attempt2: {
                    testPass: false,
                    failedTests: 1,
                    passedTests: 3,
                    totalTests: 4,
                    successRate: 75,
                },
            },
            'dummy-test-2': {
                attempt1: {
                    testPass: true,
                    failedTests: 0,
                    passedTests: 3,
                    totalTests: 3,
                    successRate: 100,
                },
            },
        };

        const expectedSummary: Summary = {
            totalTests: 7,
            totalSuccessRate: (75 * 4 + 100 * 3) / 7,
            convertedAndPassed: 6,
            convertedAndFailed: 1,
        };

        const result: SummaryJson = generateSummaryJson(testResults);

        expect(result.summary).toEqual(expectedSummary);
        expect(result['dummy-test-1']).toEqual(testResults['dummy-test-1']);
        expect(result['dummy-test-2']).toEqual(testResults['dummy-test-2']);
    });

    it('should handle a single test result with best attempt', () => {
        const testResults: TestResults = {
            'dummy-test-1': {
                attempt1: {
                    testPass: true,
                    failedTests: 0,
                    passedTests: 1,
                    totalTests: 1,
                    successRate: 100,
                },
            },
        };

        const expectedSummary: Summary = {
            totalTests: 1,
            totalSuccessRate: 100,
            convertedAndPassed: 1,
            convertedAndFailed: 0,
        };

        const result: SummaryJson = generateSummaryJson(testResults);

        expect(result.summary).toEqual(expectedSummary);
        expect(result['dummy-test-1']).toEqual(testResults['dummy-test-1']);
    });

    it('should handle empty test results', () => {
        const testResults: TestResults = {};

        const expectedSummary: Summary = {
            totalTests: 0,
            totalSuccessRate: 0,
            convertedAndPassed: 0,
            convertedAndFailed: 0,
        };

        const result: SummaryJson = generateSummaryJson(testResults);

        expect(result.summary).toEqual(expectedSummary);
    });

    it('should handle all failed tests with best attempts', () => {
        const testResults: TestResults = {
            'dummy-test-1': {
                attempt1: {
                    testPass: false,
                    failedTests: 4,
                    passedTests: 0,
                    totalTests: 4,
                    successRate: 0,
                },
                attempt2: {
                    testPass: false,
                    failedTests: 3,
                    passedTests: 0,
                    totalTests: 3,
                    successRate: 0,
                },
            },
            'dummy-test-2': {
                attempt1: {
                    testPass: false,
                    failedTests: 3,
                    passedTests: 0,
                    totalTests: 3,
                    successRate: 0,
                },
            },
        };

        const expectedSummary: Summary = {
            totalTests: 7,
            totalSuccessRate: 0, // All tests failed
            convertedAndPassed: 0,
            convertedAndFailed: 7,
        };

        const result: SummaryJson = generateSummaryJson(testResults);

        expect(result.summary).toEqual(expectedSummary);
        expect(result['dummy-test-1']).toEqual(testResults['dummy-test-1']);
        expect(result['dummy-test-2']).toEqual(testResults['dummy-test-2']);
    });
});
