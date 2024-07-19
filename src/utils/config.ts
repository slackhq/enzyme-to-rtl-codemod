import path from 'path';
import fs from 'fs';
import { config as winstonConfig } from 'winston';
// TODO: move count test case to generic utils maybe
import { countTestCases } from './prompt-generation/generate-prompt';

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
    enzymeMountAdapter: string;
    filePathWithEnzymeAdapter: string;
    logLevel: keyof typeof winstonConfig.npm.levels;
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
    enzymeMountAdapter: '',
    filePathWithEnzymeAdapter: '',
    logLevel: 'info',
};

/**
 * Configure log level
 * Winston logging levels, see: https://github.com/winstonjs/winston#logging
 * @param logLevel
 */
export const configureLogLevel = (logLevel: LogLevel): void => {
    config.logLevel = logLevel;
};

/**
 * Provide the Jest binary run command used in your project. E.g. "npm run jest"
 * @param newJestBinaryPath
 */
export const setJestBinaryPath = (newJestBinaryPath: string): void => {
    config.jestBinaryPath = newJestBinaryPath;
};

/**
 * Get jest path
 * @returns
 */
export const getJestBinaryPath = (): string => config.jestBinaryPath;

/**
 * Provide path in your project to output generated files
 * @param newOutputResultsPath
 */
export const setOutputResultsPath = (newOutputResultsPath: string): void => {
    config.outputResultsPath = path.resolve(newOutputResultsPath);
};

/**
 * Check if all the requirements are met
 * @param filePath
 */
export const checkConfiguration = (filePath: string): void => {
    if (filePath) {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error('Enzyme file provided does not exist');
        }

        // Check if it is an Enzyme file
        const importStatementRegex = /(import\s*{[^}]*}\s*from\s*'enzyme'\s*;)/;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (!importStatementRegex.test(fileContent)) {
            throw new Error(
                'Provided file is either not an Enzyme or does not import mounting method directly from Enzyme package',
            );
        }
    }

    // Check if jestBinaryPath is set and can be found
    if (!config.jestBinaryPath) {
        throw new Error(
            'Jest binary path is not set. Please use setJestBinaryPath to set it.',
        );
    } else {
        // Check if jest installed
        // TODO: maybe actually run it to check
        try {
            require.resolve('jest');
        } catch {
            throw new Error(
                'jest is not installed. Please ensure that jest is installed in the host project.',
            );
        }
    }

    // Check outputResultsPath is set and exists
    if (!config.outputResultsPath) {
        throw new Error(
            'Output results path is not set. Please use setOutputResultsPath to set it.',
        );
    } else {
        if (!fs.existsSync(config.outputResultsPath)) {
            throw new Error(
                'Output results path is set but cannot be accessed. Please use setOutputResultsPath to set it.',
            );
        }
    }

    // Check if jscodeshift is installed
    try {
        require.resolve('jscodeshift');
    } catch {
        throw new Error(
            'jscodeshift is not installed. Please ensure that jscodeshift is installed in the host project.',
        );
    }

    // Check if Enzyme is installed
    try {
        require.resolve('enzyme');
    } catch {
        throw new Error(
            'enzyme is not installed. Please ensure that Enzyme is installed in the host project.',
        );
    }

    console.log('\nStarting conversion from Enzyme to RTL');
    console.log('Jest binary path:', config.jestBinaryPath);
    console.log('Results folder path:', config.outputResultsPath);
    console.log('Enzyme file path to convert:', filePath);
    console.log('Number of test cases in file:', countTestCases(filePath));
    console.log('\n');
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
    config.enzymeMountAdapter = `${getConfigProperty('outputResultsPath')}/enzyme-mount-adapter.js`;
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
