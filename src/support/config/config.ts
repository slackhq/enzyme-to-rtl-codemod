import path from 'path';
import fs from 'fs';
import { config as winstonConfig } from 'winston';
import { countTestCases } from '../prompt-generation/utils/utils';
import {
    createCustomLogger,
    updateLogLevelForAllLoggers,
} from '../logger/logger';

export const configLogger = createCustomLogger('Config');

// Define the union type for valid log level strings
type LogLevel = keyof typeof winstonConfig.npm.levels;

interface Config {
    jestBinaryPath: string;
    outputResultsPath: string;
    filePathTitle: string;
    filePathExtension: string;
    fileConversionFolder: string;
    astTranformedFilePath: string;
    collectedDomTreeFilePath: string;
    rtlConvertedFilePath: string;
    jestRunLogsFilePath: string;
    enzymeMountAdapterFilePath: string;
    filePathWithEnzymeAdapter: string;
    enzymeImportsPresent: boolean;
    reactVersion: number;
    originalTestCaseNum: number;
}

const config: Config = {
    jestBinaryPath: '',
    outputResultsPath: '',
    filePathTitle: '',
    filePathExtension: '',
    fileConversionFolder: '',
    astTranformedFilePath: '',
    collectedDomTreeFilePath: '',
    rtlConvertedFilePath: '',
    jestRunLogsFilePath: '',
    enzymeMountAdapterFilePath: '',
    filePathWithEnzymeAdapter: '',
    enzymeImportsPresent: false,
    reactVersion: 17,
    originalTestCaseNum: 0,
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
 * Provide path in your project to output generated files
 * @param newOutputResultsPath
 */
export const setOutputResultsPath = (newOutputResultsPath: string): void => {
    const hostProjectRoot = process.cwd();
    const now = new Date();
    const timeStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const pathWithTimestamp = `${newOutputResultsPath}/${timeStamp}`;
    const resolvedPath = path.resolve(hostProjectRoot, pathWithTimestamp);
    configLogger.info(`Set output results path to "${resolvedPath}"`);
    config.outputResultsPath = resolvedPath;
};

/**
 * Check if all the requirements are met
 * @param filePath
 */
export const checkConfiguration = (filePath: string): void => {
    if (filePath) {
        configLogger.verbose('Check if Enzyme file exists');
        if (!fs.existsSync(filePath)) {
            configLogger.error('Enzyme file provided does not exist');
            throw new Error('Enzyme file provided does not exist');
        }

        // Check if it is an Enzyme file
        configLogger.verbose('Check if Enzyme file has Enzyme imports');
        const importStatementRegex = /(import\s*{[^}]*}\s*from\s*'enzyme'\s*;)/;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (importStatementRegex.test(fileContent)) {
            configLogger.verbose(`Found tests in ${filePath}`);
            config.enzymeImportsPresent = true;
        } else {
            configLogger.warn(
                'Enzyme file provided does not have any tests. Cannot collect DOM tree for tests',
            );
        }
    }

    // Check if jestBinaryPath is set and can be found
    configLogger.verbose('Check if jest binary path is set');
    if (!config.jestBinaryPath) {
        configLogger.error(
            'Jest binary path is not set. Please use setJestBinaryPath to set it.',
        );
        throw new Error(
            'Jest binary path is not set. Please use setJestBinaryPath to set it.',
        );
    } else {
        // Check if jest installed
        try {
            configLogger.verbose('Check if jest exists and can be resolved');
            require.resolve('jest');
        } catch {
            configLogger.error(
                'jest is not installed. Please ensure that jest is installed in the host project.',
            );
            throw new Error(
                'jest is not installed. Please ensure that jest is installed in the host project.',
            );
        }
    }

    // Check outputResultsPath is set and exists
    configLogger.verbose('Check if outputResultsPath is set');
    if (!config.outputResultsPath) {
        configLogger.error(
            'Output results path is not set. Please use setOutputResultsPath to set it.',
        );
        throw new Error(
            'Output results path is not set. Please use setOutputResultsPath to set it.',
        );
    } else {
        // Ensure the directory exists or create it
        configLogger.verbose('Check if output results path exists');
        try {
            if (!fs.existsSync(config.outputResultsPath)) {
                configLogger.verbose(
                    `Output results path does not exist. Creating directory: ${config.outputResultsPath}`,
                );
                fs.mkdirSync(config.outputResultsPath, { recursive: true });
                configLogger.info(
                    `Directory created: ${config.outputResultsPath}`,
                );
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

    // Check React version
    configLogger.verbose('Check enzyme version');
    const reactVersion = getReactVersion();
    if (!reactVersion) {
        configLogger.warn(
            `Could not get react version from package.json. Defaulting to ${config.reactVersion}`,
        );
    } else {
        config.reactVersion = reactVersion;
        configLogger.verbose(`Enzyme version ${config.reactVersion}`);
    }

    // Count number of test cases
    config.originalTestCaseNum = countTestCases(filePath);

    configLogger.info('Starting conversion from Enzyme to RTL');
    configLogger.info(`Jest binary path: ${config.jestBinaryPath}`);
    configLogger.info(`Results folder path: ${config.outputResultsPath}`);
    configLogger.info(`Enzyme file path to convert: ${filePath}`);
    configLogger.info(
        `Number of test cases in file: ${config.originalTestCaseNum}`,
    );
};

/**
 * Get config property
 * @param property
 * @returns
 */
export const getConfigProperty = <T extends keyof Config>(
    property: T,
): Config[T] => config[property];

export const addPathsToConfig = (filePath: string): void => {
    const { fileTitle, fileExtension } = extractFileDetails(filePath);
    config.filePathTitle = fileTitle;
    config.filePathExtension = fileExtension;
    config.fileConversionFolder = createFileConversionFolder(
        config.filePathTitle + config.filePathExtension,
    );
    config.astTranformedFilePath = `${config.fileConversionFolder}/ast-transformed-${config.filePathTitle}${config.filePathExtension}`;
    config.collectedDomTreeFilePath = `${config.fileConversionFolder}/dom-tree-${config.filePathTitle}.csv`;
    config.rtlConvertedFilePath = `${config.fileConversionFolder}/rtl-converted-${config.filePathTitle}${config.filePathExtension}`;
    config.jestRunLogsFilePath = `${config.fileConversionFolder}/jest-run-logs-${config.filePathTitle}.md`;
    config.enzymeMountAdapterFilePath = `${config.fileConversionFolder}/enzyme-mount-adapter.js`;
    config.filePathWithEnzymeAdapter = `${config.fileConversionFolder}/enzyme-mount-overwritten-${config.filePathTitle}${config.filePathExtension}`;
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
export const getReactVersion = (): number | null => {
    try {
        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8'),
        );
        const reactVersion =
            packageJson.dependencies.react ||
            packageJson.devDependencies.react ||
            null;

        if (reactVersion) {
            // Extract the main version number (e.g., "16" from "^16.8.0", "~16.8.0", etc.)
            const versionMatch = reactVersion.match(/^\D*(\d+)\./);
            const version = parseInt(versionMatch[1], 10);
            return versionMatch ? version : null;
        }
        return null;
    } catch (error) {
        return null;
    }
};
