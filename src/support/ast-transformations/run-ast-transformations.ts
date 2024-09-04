import fs from 'fs';
import { mainASTtransform } from './main-ast-transform';
import { astLogger } from './utils/ast-logger';

/**
 * Run jscodeshift and make AST conversions
 * @param filePath
 * @param testId - This unique identifier which matches the 'data-testid' attribute.
 * @returns
 */
export const converWithAST = (
    filePath: string,
    testId: string,
    astTranformedFilePath: string,
): string => {
    // Run main transformation function in jscodeshift
    astLogger.info('Start: Running AST codemod');
    const astTransformedCode = mainASTtransform(filePath, testId);

    // Get ast transformed file path
    astLogger.info(`Writing AST transformed code to ${astTranformedFilePath}`);
    fs.writeFileSync(astTranformedFilePath, astTransformedCode, 'utf-8');

    astLogger.info('Done: Running AST codemod');
    return astTransformedCode;
};
