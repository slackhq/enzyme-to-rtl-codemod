import fs from 'fs';
import path from 'path';
import {
    configureLogLevel,
    setJestBinaryPath,
    setOutputResultsPath,
    checkConfiguration,
    getConfigProperty,
    addPathsToConfig,
} from './config';

// Mock the modules
jest.mock('fs');
jest.mock('path');

// Reset config function
const resetConfig = (): void => {
    (path.resolve as jest.Mock).mockReturnValue('');
    setOutputResultsPath('');
    setJestBinaryPath('');
};

describe('Configuration Functions', () => {
    beforeEach(() => {
        resetConfig();
        jest.clearAllMocks();
    });

    describe('getConfigProperty', () => {
        it('should return the correct config property', () => {
            expect(getConfigProperty('enzymeImportsPresent')).toBe(false);
        });
    });

    describe('configureLogLevel', () => {
        it('should set the log level', () => {
            configureLogLevel('verbose');
            expect(process.env.LOG_LEVEL).toBe('verbose');
        });
    });

    describe('setJestBinaryPath', () => {
        it('should set the Jest binary path', () => {
            const jestBinaryPath = 'path/to/jest';
            setJestBinaryPath(jestBinaryPath);
            expect(getConfigProperty('jestBinaryPath')).toBe(jestBinaryPath);
        });
    });

    describe('setOutputResultsPath', () => {
        it('should set and resolve the output results path', () => {
            const outputPath = 'path/to/output';
            const resolvedPath = '/resolved/path/to/output';

            (path.resolve as jest.Mock).mockReturnValue(resolvedPath);

            setOutputResultsPath(outputPath);
            expect(getConfigProperty('outputResultsPath')).toBe(resolvedPath);
        });
    });

    describe('checkConfiguration', () => {
        it('should throw an error if the file does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            expect(() => checkConfiguration('non/existent/file')).toThrow(
                'Enzyme file provided does not exist',
            );
        });

        it('should set enzymeImportsPresent to true if it is an Enzyme file', () => {
            // Mock check if file exists
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            const fileContent = "import { mount } from 'enzyme';\nconst a = 1;";

            // Mock readFileSync to return the file content
            (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

            expect(() => checkConfiguration('some/file')).toThrow(
                'Jest binary path is not set. Please use setJestBinaryPath to set it.',
            );

            expect(getConfigProperty('enzymeImportsPresent')).toBe(true);
        });

        it('should throw an error if Jest binary path is not set', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            expect(() => checkConfiguration('some/file')).toThrow(
                'Jest binary path is not set. Please use setJestBinaryPath to set it.',
            );
        });

        it.skip('should throw an error if Jest binary path is set but jest is not installed', () => {
            // TODO: figure out how to mock this
            jest.doMock('jest', () => {
                throw new Error('Module not found');
            });

            expect(() => checkConfiguration('some/file')).toThrow(
                'jest is not installed. Please ensure that jest is installed in the host project.',
            );
        });

        it('should throw an error if output results path is not set', () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            setJestBinaryPath('jest/path');

            expect(() => checkConfiguration('some/file')).toThrow(
                'Output results path is not set. Please use setOutputResultsPath to set it.',
            );
        });

        it('should throw an error if output results path is set but does not exist', () => {
            setJestBinaryPath('jest/path');
            // Mock setOutputResultsPath
            const outputPath = 'path/to/output';
            const resolvedPath = '/resolved/path/to/output';
            (path.resolve as jest.Mock).mockReturnValue(resolvedPath);

            setOutputResultsPath(outputPath);

            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);

            expect(() => checkConfiguration('some/file')).toThrow(
                'Output results path is set but cannot be accessed. Please use setOutputResultsPath to set it.',
            );
        });

        it.skip('should throw an error if jscodeshift is not installed', () => {
            // TODO: figure out how to mock this
            jest.doMock('jscodeshift', () => {
                throw new Error('Module not found');
            });

            expect(() => checkConfiguration('some/file')).toThrow(
                'jscodeshift is not installed. Please ensure that jscodeshift is installed in the host project.',
            );
        });

        it.skip('should throw an error if enzyme is not installed', () => {
            setJestBinaryPath('jest/path');
            setOutputResultsPath('output/path');
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            // TODO: figure out how to mock this
            jest.doMock('enzyme', () => {
                throw new Error('Module not found');
            });

            expect(() => checkConfiguration('some/file')).toThrow(
                'enzyme is not installed. Please ensure that Enzyme is installed in the host project.',
            );
        });
    });

    describe('addPathsToConfig', () => {
        it('should set various paths in the config based on the provided file path', () => {
            const filePath = 'some/path/file.tsx';

            const outputPath = 'output/path';
            const resolvedPath = '/resolved/path/to/output';
            (path.resolve as jest.Mock).mockReturnValue(resolvedPath);

            setOutputResultsPath(outputPath);

            addPathsToConfig(filePath);

            expect(getConfigProperty('filePathTitle')).toBe('file');
            expect(getConfigProperty('filePathExtension')).toBe('.tsx');
            expect(getConfigProperty('astTranformedFilePath')).toBe(
                `${resolvedPath}/ast-transformed-file.tsx`,
            );
            expect(getConfigProperty('collectedDomTreeFilePath')).toBe(
                `${resolvedPath}/dom-tree-file.csv`,
            );
            expect(getConfigProperty('rtlConvertedFilePath')).toBe(
                `${resolvedPath}/rtl-converted-file.tsx`,
            );
            expect(getConfigProperty('jestRunLogsFilePath')).toBe(
                `${resolvedPath}/jest-run-logs-file.md`,
            );
            expect(getConfigProperty('enzymeMountAdapterFilePath')).toBe(
                `${resolvedPath}/enzyme-mount-adapter.js`,
            );
            expect(getConfigProperty('filePathWithEnzymeAdapter')).toBe(
                `${resolvedPath}/enzyme-mount-overwritten-file.tsx`,
            );
        });
    });
});
