// import fs from 'fs';
// import path from 'path';
// import {
//     configureLogLevel,
//     setJestBinaryPath,
//     setOutputResultsPath,
//     checkConfiguration,
//     getConfigProperty,
//     addPathsToConfig,
//     getReactVersion,
//     configLogger,
// } from './config';

// // Mock the modules
// jest.mock('fs');
// jest.mock('path');

// // Reset config function
// const resetConfig = (): void => {
//     (path.resolve as jest.Mock).mockReturnValue('');
//     setOutputResultsPath('');
//     setJestBinaryPath('');
// };

// describe('Configuration Functions', () => {
//     beforeEach(() => {
//         resetConfig();
//         jest.clearAllMocks();
//     });

//     describe('getConfigProperty', () => {
//         it('should return the correct config property', () => {
//             expect(getConfigProperty('enzymeImportsPresent')).toBe(false);
//         });
//     });

//     describe('configureLogLevel', () => {
//         it('should set the log level', () => {
//             configureLogLevel('verbose');
//             expect(process.env.LOG_LEVEL).toBe('verbose');
//         });
//     });

//     describe('setJestBinaryPath', () => {
//         it('should set the Jest binary path', () => {
//             const jestBinaryPath = 'path/to/jest';
//             setJestBinaryPath(jestBinaryPath);
//             expect(getConfigProperty('jestBinaryPath')).toBe(jestBinaryPath);
//         });
//     });

//     describe('setOutputResultsPath', () => {
//         it('should set and resolve the output results path', () => {
//             const outputPath = 'path/to/output';
//             const resolvedPath = '/resolved/path/to/output';

//             (path.resolve as jest.Mock).mockReturnValue(resolvedPath);

//             setOutputResultsPath(outputPath);
//             expect(getConfigProperty('outputResultsPath')).toBe(resolvedPath);
//         });
//     });

//     describe('getReactVersion', () => {
//         it('should return the correct major version when React is in dependencies', () => {
//             const mockPackageJson = JSON.stringify({
//                 dependencies: {
//                     react: '^16.8.0',
//                 },
//             });

//             (path.resolve as jest.Mock).mockReturnValue(
//                 '/mocked/path/to/package.json',
//             );
//             (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

//             const version = getReactVersion();
//             expect(version).toBe(16);
//             expect(fs.readFileSync).toHaveBeenCalledWith(
//                 '/mocked/path/to/package.json',
//                 'utf-8',
//             );
//         });

//         it('should return null if no react found', () => {
//             const mockPackageJson = JSON.stringify({
//                 dependencies: {
//                     enzyme: '3.11.0',
//                 },
//             });

//             (path.resolve as jest.Mock).mockReturnValue(
//                 '/mocked/path/to/package.json',
//             );
//             (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

//             const version = getReactVersion();
//             expect(version).toBe(null);
//             expect(fs.readFileSync).toHaveBeenCalledWith(
//                 '/mocked/path/to/package.json',
//                 'utf-8',
//             );
//         });
//     });

//     describe('checkConfiguration', () => {
//         it('should throw an error if the file does not exist', () => {
//             (fs.existsSync as jest.Mock).mockReturnValue(false);

//             expect(() => checkConfiguration('non/existent/file')).toThrow(
//                 'Enzyme file provided does not exist',
//             );
//         });

//         it('should set enzymeImportsPresent to true if it is an Enzyme file', () => {
//             // Mock check if file exists
//             (fs.existsSync as jest.Mock).mockReturnValue(true);
//             const fileContent = "import { mount } from 'enzyme';\nconst a = 1;";

//             // Mock readFileSync to return the file content
//             (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

//             expect(() => checkConfiguration('some/file')).toThrow(
//                 'Jest binary path is not set. Please use setJestBinaryPath to set it.',
//             );

//             expect(getConfigProperty('enzymeImportsPresent')).toBe(true);
//         });

//         it('should throw an error if Jest binary path is not set', () => {
//             (fs.existsSync as jest.Mock).mockReturnValue(true);

//             expect(() => checkConfiguration('some/file')).toThrow(
//                 'Jest binary path is not set. Please use setJestBinaryPath to set it.',
//             );
//         });

//         it.skip('should throw an error if Jest binary path is set but jest is not installed', () => {
//             // Cannot mock
//             jest.doMock('jest', () => {
//                 throw new Error('Module not found');
//             });

//             expect(() => checkConfiguration('some/file')).toThrow(
//                 'jest is not installed. Please ensure that jest is installed in the host project.',
//             );
//         });

//         it('should throw an error if output results path is not set', () => {
//             (fs.existsSync as jest.Mock).mockReturnValue(true);
//             setJestBinaryPath('jest/path');

//             expect(() => checkConfiguration('some/file')).toThrow(
//                 'Output results path is not set. Please use setOutputResultsPath to set it.',
//             );
//         });

//         it('should not create new folders for results if they exist and log that paths exist', () => {
//             setJestBinaryPath('jest/path');
//             // Mock setOutputResultsPath
//             const outputPath = 'path/to/output';
//             const resolvedPath = '/resolved/path/to/output';
//             (path.resolve as jest.Mock).mockReturnValue(resolvedPath);
//             const spyInfo = jest.spyOn(configLogger, 'info');

//             setOutputResultsPath(outputPath);

//             (fs.existsSync as jest.Mock)
//                 .mockReturnValueOnce(true)
//                 .mockReturnValueOnce(true);

//             (fs.mkdirSync as jest.Mock) = jest.fn();

//             checkConfiguration('some/file');
//             expect(spyInfo).toHaveBeenCalledWith('Output results path exists.');
//             expect(fs.mkdirSync).not.toHaveBeenCalled();
//         });

//         it('should create new folders for results if they do not exist and log that paths exist', () => {
//             setJestBinaryPath('jest/path');
//             // Mock setOutputResultsPath
//             const outputPath = 'path/to/output';
//             const resolvedPath = '/resolved/path/to/output';
//             (path.resolve as jest.Mock).mockReturnValue(resolvedPath);
//             const spyInfo = jest.spyOn(configLogger, 'info');

//             setOutputResultsPath(outputPath);

//             (fs.existsSync as jest.Mock)
//                 .mockReturnValueOnce(true)
//                 .mockReturnValueOnce(false);

//             (fs.mkdirSync as jest.Mock) = jest.fn();

//             checkConfiguration('some/file');
//             expect(spyInfo).toHaveBeenCalledWith(
//                 'Directory created: /resolved/path/to/output',
//             );
//             expect(fs.mkdirSync).toHaveBeenCalledWith(
//                 '/resolved/path/to/output',
//                 { recursive: true },
//             );
//         });

//         it.skip('should throw an error if jscodeshift is not installed', () => {
//             // Cannot mock
//             jest.doMock('jscodeshift', () => {
//                 throw new Error('Module not found');
//             });

//             expect(() => checkConfiguration('some/file')).toThrow(
//                 'jscodeshift is not installed. Please ensure that jscodeshift is installed in the host project.',
//             );
//         });

//         it.skip('should throw an error if enzyme is not installed', () => {
//             setJestBinaryPath('jest/path');
//             setOutputResultsPath('output/path');
//             (fs.existsSync as jest.Mock).mockReturnValue(true);

//             // Cannot mock
//             jest.doMock('enzyme', () => {
//                 throw new Error('Module not found');
//             });

//             expect(() => checkConfiguration('some/file')).toThrow(
//                 'enzyme is not installed. Please ensure that Enzyme is installed in the host project.',
//             );
//         });

//         it('should call check version ', () => {
//             (path.resolve as jest.Mock).mockReturnValue('/mocked/full/path');
//             (fs.existsSync as jest.Mock).mockReturnValue(true);
//             setJestBinaryPath('jest/path');
//             setOutputResultsPath('output/path');

//             const fileContent = "import { mount } from 'enzyme';\nconst a = 1;";
//             // Mock readFileSync to return the file content for test counts
//             (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);

//             const spyWarn = jest.spyOn(configLogger, 'warn');

//             checkConfiguration('some/file');
//             expect(spyWarn).toHaveBeenCalledWith(
//                 'Could not get react version from package.json. Defaulting to 17',
//             );
//         });
//     });

//     describe('addPathsToConfig', () => {
//         it('should set various paths in the config based on the provided file path', () => {
//             const filePath = 'some/path/file.jest.tsx';

//             const outputPath = 'output/path';
//             const resolvedPath = '/resolved/path/to/output';
//             (path.resolve as jest.Mock).mockReturnValue(resolvedPath);

//             (fs.mkdirSync as jest.Mock) = jest.fn();

//             // Mock Date to return a specific date and time
//             const mockDate = new Date(2024, 7, 21, 6, 6, 6);
//             jest.spyOn(global, 'Date').mockImplementation(
//                 () => mockDate as unknown as Date,
//             );
//             const expectedFolderName = `${resolvedPath}/file-jest-tsx`;

//             setOutputResultsPath(outputPath);
//             addPathsToConfig(filePath);

//             expect(getConfigProperty('filePathTitle')).toBe('file');
//             expect(getConfigProperty('filePathExtension')).toBe('.jest.tsx');
//             expect(getConfigProperty('fileConversionFolder')).toBe(
//                 expectedFolderName,
//             );
//             expect(fs.mkdirSync).toHaveBeenCalledWith(expectedFolderName, {
//                 recursive: true,
//             });
//             expect(getConfigProperty('astTranformedFilePath')).toBe(
//                 `${expectedFolderName}/ast-transformed-file.jest.tsx`,
//             );
//             expect(getConfigProperty('collectedDomTreeFilePath')).toBe(
//                 `${expectedFolderName}/dom-tree-file.csv`,
//             );
//             expect(getConfigProperty('rtlConvertedFilePath')).toBe(
//                 `${expectedFolderName}/rtl-converted-file.jest.tsx`,
//             );
//             expect(getConfigProperty('jestRunLogsFilePath')).toBe(
//                 `${expectedFolderName}/jest-run-logs-file.md`,
//             );
//             expect(getConfigProperty('enzymeMountAdapterFilePath')).toBe(
//                 `${expectedFolderName}/enzyme-mount-adapter.js`,
//             );
//             expect(getConfigProperty('filePathWithEnzymeAdapter')).toBe(
//                 `${expectedFolderName}/enzyme-mount-overwritten-file.jest.tsx`,
//             );
//         });
//     });
// });
