import fs from 'fs';
import * as path from 'path';
import { runCommand } from '../shell-helper/shell-helper';
import {
    getConfigProperty,
    checkConfiguration,
    addPathsToConfig,
} from '../config';
/**
 * Run jscodeshift and make AST conversion
 * @param filePath
 * @returns
 */
export const getASTCodemodCode = async (filePath: string): Promise<string> => {
    // Check if config is set
    checkConfiguration(filePath);

    // Add to configuration
    addPathsToConfig(filePath);

    console.log('Running AST codemod');

    // Get jscodeshift path installed in user's project
    const jscodeshiftPath = path.join(
        process.cwd(),
        'node_modules',
        '.bin',
        'jscodeshift',
    );

    // Resolve the path to your transform function
    const transformPath = require.resolve(
        'test-package-useless/dist/utils/ast-transformations/main-transform',
    );

    // Get ast transformed file path
    const astConvertedFilePath = `${getConfigProperty('astTranformedFilePath')}`;

    // Create jscodeshift command
    const jscodeshiftCommandToConvert = `${jscodeshiftPath} --parser=tsx -t ${transformPath} ${filePath} -d --outputFile ${astConvertedFilePath}`;

    // Run jscodeshift in child process
    try {
        await runCommand(jscodeshiftCommandToConvert);
    } catch (error) {
        console.log(`Did not work here. Error: ${error}`);
    }

    // Return output
    let astCodemodOutput =
        'Could not convert. Proceed without ast converted file';
    try {
        astCodemodOutput = fs.readFileSync(astConvertedFilePath, 'utf-8');
    } catch (error) {
        console.log(
            `Could not open the file. Error in outputting file ${error}`,
        );
    }
    console.log('Running AST codemod: DONE');
    return astCodemodOutput;
};
