import path from 'path';
import fs from 'fs';
import { config as winstonConfig } from 'winston';
import { countTestCases } from '../prompt-generation/utils/utils';
import {
    createCustomLogger,
    updateLogLevelForAllLoggers,
} from '../logger/logger';

export const configLogger = createCustomLogger('Config');

// Define type for valid log level strings
type LogLevel = keyof typeof winstonConfig.npm.levels;

// Config interface
export interface Config {
    // Shared
    jestBinaryPath: string;
    outputResultsPath: string;
    jsonSummaryPath: string;
    logLevel: LogLevel;
    testId: string;
    reactVersion: number;
    configInitialized: boolean;

    // Per test file
    filePathTitle: string;
    filePathExtension: string;
    fileConversionFolder: string;
    astTranformedFilePath: string;
    collectedDomTreeFilePath: string;
    originalTestCaseNum: number;
    filePathWithEnzymeAdapter: string;
    enzymeMountAdapterFilePath: string;
    enzymeImportsPresent: boolean;

    // Attempt 1
    rtlConvertedFilePathAttmp1: string;
    jestRunLogsFilePathAttmp1: string;

    // Attempt 2
    rtlConvertedFilePathAttmp2: string;
    jestRunLogsFilePathAttmp2: string;
}

// Persistent config object
const config: Config = {} as Config;

interface InitializeSharedConfigArgs {
    jestBinaryPath: string;
    outputResultsPath: string;
    logLevel: LogLevel;
    testId: string;
}

/**
 * Initialize shared config
 * @param {Object} options
 * @param {string} options.jestBinaryPath - The path to the Jest binary.
 * @param {string} options.outputResultsPath - The path where the test results
 * @param {string} options.logLevel - The logging level for the test execution.
 * @param {string} options.testId - getByTestAttribute
 *
 */
const initializeSharedConfig = ({
    jestBinaryPath,
    outputResultsPath,
    logLevel,
    testId,
}: InitializeSharedConfigArgs): void => {
    config.jestBinaryPath = jestBinaryPath;
    config.outputResultsPath = setOutputResultsPath(outputResultsPath);
    config.jsonSummaryPath = `${config.outputResultsPath}/summary.json`;
    config.logLevel = logLevel;
    // Set log level
    configureLogLevel(config.logLevel);
    config.testId = testId;
    config.reactVersion = getReactVersion();

    // Check shared config
    checkSharedConfig();

    config.configInitialized = true;
};

// Main function to initialize config
// Define an interface for the named arguments
interface InitializeConfigArgs {
    filePath: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    logLevel?: LogLevel;
}

/**
 * Initialize the configuration
 *
 * This function ensures that the shared configuration is initialized once and then
 * initializes or updates the configuration specific to a particular test file.
 * It returns the updated configuration object, which can be used throughout the
 * testing process.
 *
 * @param {Object} options
 * @param {string} options.filePath - The path to the test file being processed.
 * @param {string} options.jestBinaryPath - The path to the Jest binary that can run one test file
 * @param {string} options.outputResultsPath - The path for the results
 * @param {string} options.testId - getByTestAttribute
 * @param {string} [options.logLevel='info'] - The logging level 'info' or 'verbose'
 *
 * @returns {Config} The configuration object
 *
 * @example
 * const config = initializeConfig({
 *   filePath: 'tests/example.jest.tsx',
 *   jestBinaryPath: 'npm jest',
 *   outputResultsPath: 'temp',
 *   testId: 'data-test',
 *   logLevel: 'verbose',
 * });
 */
export const initializeConfig = ({
    filePath,
    jestBinaryPath,
    outputResultsPath,
    testId,
    logLevel = 'info',
}: InitializeConfigArgs): Config => {
    // Check if the shared config has already been initialized
    if (!config.configInitialized) {
        initializeSharedConfig({
            jestBinaryPath,
            outputResultsPath,
            logLevel,
            testId,
        });
    }

    // Initialize or update per test file properties
    initializePerFileConfig(filePath);

    // Count number of test cases
    configLogger.info('Starting conversion from Enzyme to RTL');
    configLogger.info(`Jest binary path: ${config.jestBinaryPath}`);
    configLogger.info(`Results folder path: ${config.outputResultsPath}`);
    configLogger.info(`Enzyme file path to convert: ${filePath}`);
    configLogger.info(
        `Number of test cases in file: ${config.originalTestCaseNum}`,
    );

    return config;
};

const initializePerFileConfig = (filePath: string): void => {
    // Common
    const { fileTitle, fileExtension } = extractFileDetails(filePath);
    config.filePathTitle = fileTitle;
    config.filePathExtension = fileExtension;
    config.fileConversionFolder = createFileConversionFolder(
        config.filePathTitle + config.filePathExtension,
    );
    config.astTranformedFilePath = `${config.fileConversionFolder}/ast-transformed-${config.filePathTitle}${config.filePathExtension}`;
    config.collectedDomTreeFilePath = `${config.fileConversionFolder}/dom-tree-${config.filePathTitle}.csv`;
    config.originalTestCaseNum = countTestCases(filePath);
    config.filePathWithEnzymeAdapter = `${config.fileConversionFolder}/enzyme-mount-overwritten-${config.filePathTitle}${config.filePathExtension}`;
    config.enzymeMountAdapterFilePath = `${config.fileConversionFolder}/enzyme-mount-adapter.js`;
    config.enzymeImportsPresent = checkIfEnzyme(filePath);

    // Attempt 1
    config.rtlConvertedFilePathAttmp1 = `${config.fileConversionFolder}/attmp-1-rtl-converted-${config.filePathTitle}${config.filePathExtension}`;
    config.jestRunLogsFilePathAttmp1 = `${config.fileConversionFolder}/attmp-1-jest-run-logs-${config.filePathTitle}.md`;

    // Attempt 2
    config.rtlConvertedFilePathAttmp2 = `${config.fileConversionFolder}/attmp-2-rtl-converted-${config.filePathTitle}${config.filePathExtension}`;
    config.jestRunLogsFilePathAttmp2 = `${config.fileConversionFolder}/attmp-2-jest-run-logs-${config.filePathTitle}.md`;

    // Check per file config
    checkPerFileConfig(filePath);
};

/**
 * Configure log level
 * Winston logging levels, see: https://github.com/winstonjs/winston#logging
 * @param logLevel
 */
export const configureLogLevel = (logLevel: LogLevel): void => {
    configLogger.info(`Set log level to ${logLevel}`);
    process.env.LOG_LEVEL = logLevel as string;
    // Update the global log level and all loggers
    updateLogLevelForAllLoggers(logLevel as string);
};

/**
 * Provide the Jest binary run command used in your project. E.g. "npm run jest"
 * @param newJestBinaryPath
 */
export const setJestBinaryPath = (newJestBinaryPath: string): void => {
    configLogger.info(`Set jest binary path to "${newJestBinaryPath}"`);
    config.jestBinaryPath = newJestBinaryPath;
};

/**
 * Create timestamped results folder
 * @param outputResultsPath
 */
export const setOutputResultsPath = (outputResultsPath: string): string => {
    const hostProjectRoot = process.cwd();
    const now = new Date();
    const timeStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const pathWithTimestamp = `${outputResultsPath}/${timeStamp}`;
    const resolvedPath = path.resolve(hostProjectRoot, pathWithTimestamp);
    configLogger.info(`Set output results path to "${resolvedPath}"`);
    return resolvedPath;
};

/**
 * Extract file title and extension
 * @param filePath
 * @returns
 */
const extractFileDetails = (
    filePath: string,
): { fileTitle: string; fileExtension: string } => {
    // Extract the file name with extension
    const fileNameWithExtension = filePath.split('/').pop();

    if (!fileNameWithExtension) {
        throw new Error('Invalid file path');
    }

    // Extract the file extension
    const fileExtension = fileNameWithExtension.slice(
        fileNameWithExtension.indexOf('.'),
    );

    // Extract the file title by removing the extension from the file name
    const fileTitle = fileNameWithExtension.slice(
        0,
        fileNameWithExtension.indexOf('.'),
    );

    return { fileTitle, fileExtension };
};

/**
 * Create folder for each test case conversion
 * @param filePath
 * @returns
 */
const createFileConversionFolder = (filePath: string): string => {
    const fileConversionFolder = `${config.outputResultsPath}/${filePath.replace(/[<>:"/|?*.]+/g, '-')}`;
    configLogger.verbose(`Create folder for ${fileConversionFolder}`);
    fs.mkdirSync(fileConversionFolder, { recursive: true });
    return fileConversionFolder;
};

/**
 * Get React version from package.json
 * @returns
 */
export const getReactVersion = (): number => {
    let reactVersion: number | null = null;

    try {
        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8'),
        );

        const reactVersionString =
            packageJson.dependencies.react ||
            packageJson.devDependencies.react ||
            null;

        if (reactVersionString) {
            // Extract the main version number (e.g., "16" from "^16.8.0", "~16.8.0", etc.)
            const versionMatch = reactVersionString.match(/^\D*(\d+)\./);
            if (versionMatch) {
                reactVersion = parseInt(versionMatch[1], 10);
            }
        }
    } catch (error) {
        configLogger.warn(
            'Error reading package.json. Defaulting to React version 17',
        );
    }

    // Check the version and deault to 17 if not found
    if (reactVersion === null) {
        configLogger.warn(
            'Could not get React version from package.json. Defaulting to 17',
        );
        // Default to React version 17 if not found
        return 17;
    } else {
        return reactVersion;
    }
};

export const checkSharedConfig = (): void => {
    // Check if jestBinaryPath can be found
    configLogger.verbose('Check if jest exists and can be resolved');
    try {
        require.resolve('jest');
    } catch {
        configLogger.error(
            'jest is not installed. Please ensure that jest is installed in the host project.',
        );
        throw new Error(
            'jest is not installed. Please ensure that jest is installed in the host project.',
        );
    }

    // Ensure the output directory exists or create it
    configLogger.verbose('Check if output results path exists');
    try {
        if (!fs.existsSync(config.outputResultsPath)) {
            configLogger.verbose(
                `Output results path does not exist. Creating directory: ${config.outputResultsPath}`,
            );
            fs.mkdirSync(config.outputResultsPath, { recursive: true });
            configLogger.info(`Directory created: ${config.outputResultsPath}`);
        } else {
            configLogger.info('Output results path exists.');
        }
    } catch (error) {
        configLogger.error(
            `Failed to create output results path: ${config.outputResultsPath}\nError: ${error}`,
        );
        throw new Error(
            `Failed to create output results path: ${config.outputResultsPath}\nError: ${error}`,
        );
    }

    // Check if jscodeshift is installed
    try {
        configLogger.verbose('Check if jscodeshift exists and can be resolved');
        require.resolve('jscodeshift');
    } catch {
        configLogger.error(
            'jscodeshift is not installed. Please ensure that jscodeshift is installed in the host project.',
        );
        throw new Error(
            'jscodeshift is not installed. Please ensure that jscodeshift is installed in the host project.',
        );
    }

    // Check if Enzyme is installed
    try {
        configLogger.verbose('Check if enzyme exists and can be resolved');
        require.resolve('enzyme');
    } catch {
        configLogger.error(
            'Enzyme is not installed. Please ensure that Enzyme is installed in the host project.',
        );
        throw new Error(
            'Enzyme is not installed. Please ensure that Enzyme is installed in the host project.',
        );
    }
};

const checkPerFileConfig = (filePath: string): void => {
    // Check if file path exists
    if (filePath) {
        configLogger.verbose('Check if Enzyme file exists');
        if (!fs.existsSync(filePath)) {
            configLogger.error('Enzyme file provided does not exist');
            throw new Error('Enzyme file provided does not exist');
        }
    }

    // Check if file conversion folder exists
    if (!fs.existsSync(config.fileConversionFolder)) {
        configLogger.error('Results folder for conversions does not exist');
        throw new Error('Results folder for conversions does not exist');
    }
};

const checkIfEnzyme = (filePath: string): boolean => {
    // Check if it is an Enzyme file
    configLogger.verbose('Check if Enzyme file has Enzyme imports');
    const importStatementRegex = /(import\s*{[^}]*}\s*from\s*'enzyme'\s*;)/;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (importStatementRegex.test(fileContent)) {
        configLogger.verbose(`Found tests in ${filePath}`);
        return true;
    }
    configLogger.warn(
        'Enzyme file provided does not have any tests. Cannot collect DOM tree for tests',
    );
    return false;
};

// /**
//  * Get config property
//  * @param property
//  * @returns
//  */
// export const getConfigProperty = <T extends keyof Config>(
//     property: T,
// ): Config[T] => config[property];
