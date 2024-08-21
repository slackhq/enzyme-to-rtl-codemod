import * as runTestAnalysis from './run-test-analysis';
import { runCommand, ShellProcess } from '../shell-helper/shell-helper';
import { getConfigProperty } from '../config/config';
import fs from 'fs';

// Mock implementations
jest.mock('../config/config', () => ({
    getConfigProperty: jest.fn(),
}));
jest.mock('../shell-helper/shell-helper');
jest.mock('fs');

describe('runTestAndAnalyze', () => {
    const getConfigPropertyMock = getConfigProperty as jest.MockedFunction<
        typeof getConfigProperty
    >;
    const mockedRunCommand = runCommand as jest.MockedFunction<
        typeof runCommand
    >;
    const mockedWriteFileSync = fs.writeFileSync as jest.MockedFunction<
        typeof fs.writeFileSync
    >;

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should run the RTL test, analyze the results and write a json file by default', async () => {
        const filePath = 'path/to/testFile';
        const testPassMock = false;

        // Mock jest binary path
        getConfigPropertyMock.mockImplementation((property) => {
            if (property === 'jestBinaryPath') return '/path/to/jestBinary';
            if (property === 'jestRunLogsFilePath')
                return '/path/to/jestRunLogs';
            if (property === 'fileConversionFolder')
                return '/path/to/outputResultsPath/fileConversionFolder';
            return '';
        });

        // Mock shell process
        const mockShellProcess: ShellProcess = {
            process: {} as ShellProcess['process'],
            output: `
                running jest without "--shard"
                1
                FAIL modern filepath

                Test Suites: 1 failed, 1 total
                Tests:       1 failed, 1 total
                Snapshots:   0 total
                Time:        2.589 s, estimated 3 s
            `,
            stderr: '',
            finished: true,
            command: 'mocked command',
        };
        // Mock jest run logs
        mockedRunCommand.mockResolvedValue(mockShellProcess);

        // Mock remove ansi code method
        const spyRemoveANSIEscapeCodes = jest.spyOn(
            runTestAnalysis,
            'removeANSIEscapeCodes',
        );
        spyRemoveANSIEscapeCodes.mockImplementation((input: string) => input);

        // Mock analyzeLogsForErrors
        const spyAnalyzeLogsForErrors = jest.spyOn(
            runTestAnalysis,
            'analyzeLogsForErrors',
        );
        spyAnalyzeLogsForErrors.mockImplementation(() => testPassMock);

        // Mock extractTestResults
        const spyExtractTestResults = jest.spyOn(
            runTestAnalysis,
            'extractTestResults',
        );

        // Run the method
        const result = await runTestAnalysis.runTestAndAnalyze(filePath);

        // Run command assertion
        expect(mockedRunCommand).toHaveBeenCalledTimes(1);
        expect(mockedRunCommand).toHaveBeenCalledWith(
            '/path/to/jestBinary path/to/testFile',
        );

        // Remove Ansi assertion
        expect(spyRemoveANSIEscapeCodes).toHaveBeenCalledTimes(1);
        expect(spyRemoveANSIEscapeCodes).toHaveBeenCalledWith(
            mockShellProcess.output + mockShellProcess.stderr,
        );

        // Write file assertions
        expect(mockedWriteFileSync).toHaveBeenCalledTimes(2);
        expect(mockedWriteFileSync).toHaveBeenNthCalledWith(
            1,
            '/path/to/jestRunLogs',
            mockShellProcess.output + mockShellProcess.stderr,
            'utf-8',
        );
        // Stringify the expected JSON object for comparison
        const expectedJsonString = JSON.stringify(
            {
                testPass: testPassMock,
                failedTests: 1,
                passedTests: 0,
                totalTests: 1,
                successRate: 0,
            },
            null,
            2,
        );

        expect(mockedWriteFileSync).toHaveBeenNthCalledWith(
            2,
            '/path/to/outputResultsPath/fileConversionFolder/summary.json',
            expectedJsonString,
            'utf-8',
        );

        // Analyze logs for errors assertion
        expect(spyAnalyzeLogsForErrors).toHaveBeenCalledTimes(1);
        expect(spyAnalyzeLogsForErrors).toHaveBeenCalledWith(
            mockShellProcess.output + mockShellProcess.stderr,
        );

        // Extract test results
        expect(spyExtractTestResults).toHaveBeenCalledTimes(1);

        // Check results is returned
        expect(result).toEqual({
            testPass: testPassMock,
            failedTests: 1,
            passedTests: 0,
            totalTests: 1,
            successRate: 0,
        });
    });

    describe('analyzeLogsForErrors', () => {
        it.each([
            ['Some log content\nFAIL modern\nMore log content'],
            ['Some log content\nNo tests found\nMore log content'],
            ['Some log content\nNot run\nMore log content'],
            ['Some log content\nFATAL ERROR\nMore log content'],
            [''],
        ])(
            'should return false if logs contain specific error messages or are empty',
            (logs) => {
                expect(runTestAnalysis.analyzeLogsForErrors(logs)).toBe(false);
            },
        );

        it('should return true if logs do not contain any error strings', () => {
            const logs = 'All tests passed successfully\nNo issues found';
            expect(runTestAnalysis.analyzeLogsForErrors(logs)).toBe(true);
        });
    });

    describe('extractTestResults', () => {
        it.each([
            [
                'Tests:       1 failed, 1 total',
                {
                    failedTests: 1,
                    passedTests: 0,
                    totalTests: 1,
                    successRate: 0,
                },
            ],
            [
                'Tests:       1 passed, 1 total',
                {
                    failedTests: 0,
                    passedTests: 1,
                    totalTests: 1,
                    successRate: 100,
                },
            ],
            [
                'Tests:       1 skipped, 1 total',
                {
                    failedTests: 0,
                    passedTests: 0,
                    totalTests: 1,
                    successRate: 0,
                },
            ],
            [
                'Tests:       1 failed, 1 passed, 2 total',
                {
                    failedTests: 1,
                    passedTests: 1,
                    totalTests: 2,
                    successRate: 50,
                },
            ],
            [
                'Tests:       1 failed, 1 skipped, 1 passed, 3 total',
                {
                    failedTests: 1,
                    passedTests: 1,
                    totalTests: 3,
                    successRate: 33.33333333333333,
                },
            ],
            [
                'Tests:       10 failed, 5 passed, 15 total',
                {
                    failedTests: 10,
                    passedTests: 5,
                    totalTests: 15,
                    successRate: 33.33333333333333,
                },
            ],
        ])(
            'should correctly extract test results from logs: %s',
            (logs, expected) => {
                expect(runTestAnalysis.extractTestResults(logs)).toEqual(
                    expected,
                );
            },
        );
    });
});
