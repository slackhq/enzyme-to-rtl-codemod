import fs from 'fs';
import { mainASTtransform } from './main-ast-transform';
import { astLogger } from './utils/ast-logger';

/**
 * Run jscodeshift and make AST conversions.
 *
 * This function takes a source file path and applies an AST transformation.
 * The transformed code is written to the specified astTransformedFilePath.
 * If an error occurs during the transformation,
 * the original file content is returned.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.filePath - The path to the original file to be transformed.
 * @param {string} params.testId - The identifier for the specific AST transformation.
 * @param {string} params.astTransformedFilePath - The file path where the transformed code should be saved.
 * @returns {string} The transformed code, or the original file content if an error occurs.
 */
export const convertWithAST = ({
    filePath,
    testId,
    astTransformedFilePath,
}: {
    filePath: string;
    testId: string;
    astTransformedFilePath: string;
}): string => {
    // TODO: add error handling for running ast main transform method
    // Run main transformation function in jscodeshift
    astLogger.info('Start: Running AST codemod');
    let astTransformedCode = '';
    try {
        astTransformedCode = mainASTtransform(filePath, testId);
    } catch (error) {
        astLogger.error(
            `Could not convert with AST. Returning original file content\nError: ${error}`,
        );
        astTransformedCode = fs.readFileSync(filePath, 'utf-8');
    }

    // Get ast transformed file path
    astLogger.info(`Writing AST transformed code to ${astTransformedFilePath}`);
    fs.writeFileSync(astTransformedFilePath, astTransformedCode, 'utf-8');

    astLogger.info('Done: Running AST codemod');
    return astTransformedCode;
};
