// __tests__/runTestAndAnalyzeFile.test.ts
import { runTestAndAnalyzeFile, removeANSIEscapeCodes } from '../src/utils/enzyme-helper/run-test-analysis';
import { runCommand, ShellProcess } from '../src/utils/shell-helper/shell-helper';
import { getJestBinaryPath, getConfigProperty } from '../src/utils/config';
import fs from 'fs';

// Mock implementations
jest.mock('../src/utils/shell-helper/shell-helper');
jest.mock('../src/utils/config');
jest.mock('fs');

describe('runTestAndAnalyzeFile', () => {
    const mockedRunCommand = runCommand as jest.MockedFunction<typeof runCommand>;
    const mockedGetJestBinaryPath = getJestBinaryPath as jest.MockedFunction<typeof getJestBinaryPath>;
    const mockedgetConfigProperty = getConfigProperty as jest.MockedFunction<typeof getConfigProperty>;
    const mockedWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should run the RTL test and analyze the results', async () => {
        const filePath = 'path/to/testFile';

        // Mock jest binary path
        mockedGetJestBinaryPath.mockReturnValue('/path/to/jestBinary');

         // Mock shell process
        const mockShellProcess: ShellProcess = {
            process: {} as any,
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
        mockedRunCommand.mockResolvedValue(mockShellProcess);

        // Mock jest run logs
        mockedgetConfigProperty.mockReturnValue('path/to/jestRunLogs')

        const mockRemoveANSIEscapeCodes = jest.spyOn(require('../src/utils/enzyme-helper/run-test-analysis'), 'removeANSIEscapeCodes');
        mockRemoveANSIEscapeCodes.mockImplementation((input) => input); // Mock implementation if needed


        // Run the method
        const result = await runTestAndAnalyzeFile(filePath);

        console.log('result:', result)

        // Jest binary assertion
        expect(mockedGetJestBinaryPath).toHaveBeenCalledTimes(1);

        // Run command assertion
        expect(mockedRunCommand).toHaveBeenCalledTimes(1);
        expect(mockedRunCommand).toHaveBeenCalledWith('/path/to/jestBinary path/to/testFile');

        // Remove Ansi assertion
        expect(mockRemoveANSIEscapeCodes).toHaveBeenCalledTimes(1);
        expect(mockRemoveANSIEscapeCodes).toHaveBeenCalledWith(mockShellProcess.output + mockShellProcess.stderr);

        // Write file assertions
        expect(mockedWriteFileSync).toHaveBeenCalledTimes(1);
        expect(mockedWriteFileSync).toHaveBeenCalledWith('path/to/jestRunLogs', mockShellProcess.output + mockShellProcess.stderr, 'utf8');


        // expect(mockedgetConfigProperty).toHaveBeenCalledTimes(1);


        
        
        



    });
});