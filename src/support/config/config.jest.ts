import fs from 'fs';
import path from 'path';
import {
    configureLogLevel,
    setOutputResultsPath,
    getReactVersion,
    checkSharedConfig,
    checkPerFileConfig,
    checkIfEnzyme,
    configLogger,
    extractFileDetails,
    createFileConversionFolder,
    initializeConfig,
} from './config';

// Mock the modules
jest.mock('fs');
jest.mock('path');

// Reset config function
const resetConfig = (): void => {
    (path.resolve as jest.Mock).mockReturnValue('');
    setOutputResultsPath('');
};

describe('Configuration Functions', () => {
    beforeEach(() => {
        resetConfig();
        jest.clearAllMocks();
    });

    describe('initializeConfig - Happy Path', () => {
        it('should initialize the config with the correct values', () => {
            const mockArgs = {
                filePath: 'some/path/to/file.test.tsx',
                jestBinaryPath: 'path/to/jest',
                outputResultsPath: 'path/to/results',
                testId: 'data-test-id',
                logLevel: 'verbose',
            };
            // Mock the file content to simulate test cases number
            const mockFileContent = `
            it('should do something', () => {});
            test('should do something else', () => {});
            `;
            jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

            // Pass the verification for the Enzyme file
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);

            // Mock outputResultsPath path resolve
            (path.resolve as jest.Mock).mockReturnValue(
                mockArgs.outputResultsPath,
            );

            // Call the function to initialize the config
            const resultConfig = initializeConfig(mockArgs);

            // Assertions for shared config
            expect(resultConfig.jestBinaryPath).toBe(mockArgs.jestBinaryPath);
            expect(resultConfig.outputResultsPath).toBe(
                mockArgs.outputResultsPath,
            );
            expect(resultConfig.jsonSummaryPath).toContain(
                `${mockArgs.outputResultsPath}/summary.json`,
            );
            expect(resultConfig.logLevel).toBe(mockArgs.logLevel);
            expect(resultConfig.testId).toBe(mockArgs.testId);
            expect(resultConfig.reactVersion).toBe(17);
            expect(resultConfig.configInitialized).toBe(true);

            // Assertions for per test file config
            expect(resultConfig.filePathTitle).toBe('file');
            expect(resultConfig.filePathExtension).toBe('.test.tsx');
            expect(resultConfig.fileConversionFolder).toBe(
                `${mockArgs.outputResultsPath}/file-test-tsx`,
            );
            expect(resultConfig.astTranformedFilePath).toBe(
                `${resultConfig.fileConversionFolder}/ast-transformed-file.test.tsx`,
            );
            expect(resultConfig.collectedDomTreeFilePath).toBe(
                `${resultConfig.fileConversionFolder}/dom-tree-file.csv`,
            );
            expect(resultConfig.originalTestCaseNum).toBe(2);
            expect(resultConfig.filePathWithEnzymeAdapter).toBe(
                `${resultConfig.fileConversionFolder}/enzyme-mount-overwritten-file.test.tsx`,
            );
            expect(resultConfig.enzymeMountAdapterFilePath).toBe(
                `${resultConfig.fileConversionFolder}/enzyme-mount-adapter.js`,
            );
            expect(resultConfig.enzymeImportsPresent).toBe(false);

            // Assertions for attempt paths
            expect(resultConfig.rtlConvertedFilePathAttmp1).toContain(
                `${resultConfig.fileConversionFolder}/attmp-1-rtl-converted-file.test.tsx`,
            );
            expect(resultConfig.jestRunLogsFilePathAttmp1).toContain(
                `${resultConfig.fileConversionFolder}/attmp-1-jest-run-logs-file.md`,
            );
            expect(resultConfig.rtlConvertedFilePathAttmp2).toContain(
                `${resultConfig.fileConversionFolder}/attmp-2-rtl-converted-file.test.tsx`,
            );
            expect(resultConfig.jestRunLogsFilePathAttmp2).toContain(
                `${resultConfig.fileConversionFolder}/attmp-2-jest-run-logs-file.md`,
            );
        });
    });

    describe('initializePerFileConfig', () => {});

    describe('configureLogLevel', () => {
        it('should set the log level', () => {
            configureLogLevel('verbose');
            expect(process.env.LOG_LEVEL).toBe('verbose');
        });
    });

    describe('setOutputResultsPath', () => {
        it('should set and resolve the output results path', () => {
            const outputPath = 'path/to/output';
            const resolvedPath = '/resolved/path/to/output';

            (path.resolve as jest.Mock).mockReturnValue(resolvedPath);

            const resultPath = setOutputResultsPath(outputPath);
            expect(resultPath).toBe(resolvedPath);
        });
    });

    describe('extractFileDetails', () => {
        it('should extract the file title and extension correctly', () => {
            const filePath = 'some/path/to/file.jest.tsx';

            const result = extractFileDetails(filePath);

            expect(result).toEqual({
                fileTitle: 'file',
                fileExtension: '.jest.tsx',
            });
        });

        it('should throw an error if the file path is invalid', () => {
            const invalidFilePath = 'some/path/to/folder/';

            expect(() => extractFileDetails(invalidFilePath)).toThrow(
                'Invalid file path',
            );
        });
    });

    describe('createFileConversionFolder', () => {
        it('should create the folder and return the correct path', () => {
            const filePath = 'file.jest.tsx';

            const expectedFolderPath = 'undefined/file-jest-tsx';
            const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');

            const result = createFileConversionFolder(filePath);

            expect(result).toBe(expectedFolderPath);
            expect(mkdirSyncSpy).toHaveBeenCalledWith(expectedFolderPath, {
                recursive: true,
            });
        });

        it('should sanitize the folder name by replacing invalid characters', () => {
            const filePath = 'file<name>.jest.tsx';

            const expectedFolderPath = 'undefined/file-name-jest-tsx';
            const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');

            const result = createFileConversionFolder(filePath);

            expect(result).toBe(expectedFolderPath);
            expect(mkdirSyncSpy).toHaveBeenCalledWith(expectedFolderPath, {
                recursive: true,
            });
        });
    });

    describe('getReactVersion', () => {
        it('should return the correct major version when React is in dependencies', () => {
            const mockPackageJson = JSON.stringify({
                dependencies: {
                    react: '^16.8.0',
                },
            });

            (path.resolve as jest.Mock).mockReturnValue(
                '/mocked/path/to/package.json',
            );
            (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

            const version = getReactVersion();
            expect(version).toBe(16);
            expect(fs.readFileSync).toHaveBeenCalledWith(
                '/mocked/path/to/package.json',
                'utf-8',
            );
        });

        it('should default to React version 17 if no React version is found', () => {
            const mockPackageJson = JSON.stringify({
                dependencies: {
                    enzyme: '3.11.0',
                },
            });

            (path.resolve as jest.Mock).mockReturnValue(
                '/mocked/path/to/package.json',
            );
            (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

            const version = getReactVersion();
            expect(version).toBe(17);
            expect(fs.readFileSync).toHaveBeenCalledWith(
                '/mocked/path/to/package.json',
                'utf-8',
            );
        });
    });

    describe('checkSharedConfig', () => {
        it('should create the output directory if it does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

            checkSharedConfig();
            expect(fs.mkdirSync).toHaveBeenCalledWith(undefined, {
                recursive: true,
            });
        });

        it('should log and skip directory creation if it exists', () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

            const spyInfo = jest.spyOn(configLogger, 'info');
            checkSharedConfig();
            expect(spyInfo).toHaveBeenCalledWith('Output results path exists.');
        });
    });

    describe('checkPerFileConfig', () => {
        it('should throw an error if the test file does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

            expect(() => checkPerFileConfig('non/existent/file')).toThrow(
                'Enzyme file provided does not exist',
            );
        });

        it('should throw an error if the file conversion folder does not exist', () => {
            (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
            (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

            expect(() => checkPerFileConfig('some/file')).toThrow(
                'Results folder for conversions does not exist',
            );
        });
    });

    describe('checkIfEnzyme', () => {
        it('should return true if the file contains Enzyme imports', () => {
            const fileContent = "import { mount } from 'enzyme';\nconst a = 1;";
            (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

            const result = checkIfEnzyme('some/file');
            expect(result).toBe(true);
        });

        it('should return false if the file does not contain Enzyme imports', () => {
            const fileContent = "import React from 'react';\nconst a = 1;";
            (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

            const result = checkIfEnzyme('some/file');
            expect(result).toBe(false);
        });
    });
});
