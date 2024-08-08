import path from 'path';
import fs from 'fs';
import { config as winstonConfig } from 'winston';
// TODO: move count test case to generic utils maybe
import { countTestCases } from './prompt-generation/utils/utils';
import createCustomLogger from './logger/logger';

export const configLogger = createCustomLogger('Config');

// Define the union type for valid log level strings
type LogLevel = keyof typeof winstonConfig.npm.levels;

interface Config {
    jestBinaryPath: string;
    outputResultsPath: string;
    filePathTitle: string;
    filePathExtension: string;
    astTranformedFilePath: string;
    collectedDomTreeFilePath: string;
    rtlConvertedFilePath: string;
    jestRunLogsFilePath: string;
    enzymeMountAdapterFilePath: string;
    filePathWithEnzymeAdapter: string;
    enzymeImportsPresent: boolean;
}

const config: Config = {
    jestBinaryPath: '',
    outputResultsPath: '',
    filePathTitle: '',
    filePathExtension: '',
    astTranformedFilePath: '',
    collectedDomTreeFilePath: '',
    rtlConvertedFilePath: '',
    jestRunLogsFilePath: '',
    enzymeMountAdapterFilePath: '',
    filePathWithEnzymeAdapter: '',
    enzymeImportsPresent: false,
};

/**
 * Configure log level
 * Winston logging levels, see: https://github.com/winstonjs/winston#logging
 * @param logLevel
 */
export const configureLogLevel = (logLevel: LogLevel): void => {
    configLogger.info(`Set log level to ${logLevel}`);
    process.env.LOG_LEVEL = logLevel as string;
};

/**
 * Provide the Jest binary run command used in your project. E.g. "npm run jest"
 * @param newJestBinaryPath
 */
export const setJestBinaryPath = (newJestBinaryPath: string): void => {
    configLogger.info(`Set jest binary path to ${newJestBinaryPath}`);
    config.jestBinaryPath = newJestBinaryPath;
};

/**
 * Provide path in your project to output generated files
 * @param newOutputResultsPath
 */
export const setOutputResultsPath = (newOutputResultsPath: string): void => {
    configLogger.info(`Set output results path to ${newOutputResultsPath}`);
    config.outputResultsPath = path.resolve(newOutputResultsPath);
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
        }
        configLogger.warn(
            'Enzyme file provided does not have any tests. Cannot collect DOM tree for tests',
        );
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
        // TODO: maybe actually run it to check
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
    configLogger.verbose('Check if jest exists and can be resolved');
    if (!config.outputResultsPath) {
        configLogger.error(
            'Output results path is not set. Please use setOutputResultsPath to set it.',
        );
        throw new Error(
            'Output results path is not set. Please use setOutputResultsPath to set it.',
        );
    } else {
        configLogger.verbose('Check if output results path exists');
        if (!fs.existsSync(config.outputResultsPath)) {
            configLogger.error(
                'Output results path is set but cannot be accessed. Please use setOutputResultsPath to set it.',
            );
            throw new Error(
                'Output results path is set but cannot be accessed. Please use setOutputResultsPath to set it.',
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

    configLogger.info('Starting conversion from Enzyme to RTL');
    configLogger.info(`Jest binary path: ${config.jestBinaryPath}`);
    configLogger.info(`Results folder path: ${config.outputResultsPath}`);
    configLogger.info(`Enzyme file path to convert: ${filePath}`);
    configLogger.info(
        `Number of test cases in file: ${countTestCases(filePath)}`,
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
    config.astTranformedFilePath = `${config.outputResultsPath}/ast-transformed-${config.filePathTitle}${config.filePathExtension}`;
    config.collectedDomTreeFilePath = `${config.outputResultsPath}/dom-tree-${config.filePathTitle}.csv`;
    config.rtlConvertedFilePath = `${getConfigProperty('outputResultsPath')}/rtl-converted-${config.filePathTitle}${config.filePathExtension}`;
    config.jestRunLogsFilePath = `${getConfigProperty('outputResultsPath')}/jest-run-logs-${config.filePathTitle}.md`;
    config.enzymeMountAdapterFilePath = `${getConfigProperty('outputResultsPath')}/enzyme-mount-adapter.js`;
    config.filePathWithEnzymeAdapter = `${getConfigProperty('outputResultsPath')}/enzyme-mount-overwritten-${config.filePathTitle}${config.filePathExtension}`;
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