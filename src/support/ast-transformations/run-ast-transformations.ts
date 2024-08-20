import fs from 'fs';
import { mainASTtransform } from './main-ast-transform';
import { astLogger } from './utils/ast-logger';
import {
    getConfigProperty,
    checkConfiguration,
    addPathsToConfig,
} from '../config';

/**
 * Run jscodeshift and make AST conversions
 * @param filePath
 * @param testId - This unique identifier which matches the 'data-testid' attribute.
 * @returns
 */
export const converWithAST = (filePath: string, testId: string): string => {
    // Check if config is set
    checkConfiguration(filePath);

    // Add to configuration
    addPathsToConfig(filePath);

    // Run main transformation function in jscodeshift
    astLogger.info('Start: Running AST codemod');
    const astTransformedCode = mainASTtransform(filePath, testId);

    // Get ast transformed file path
    const astConvertedFilePath = `${getConfigProperty('astTranformedFilePath')}`;
    astLogger.info(`Writing AST transformed code to ${astConvertedFilePath}`);
    fs.writeFileSync(astConvertedFilePath, astTransformedCode, 'utf-8');

    astLogger.info('Done: Running AST codemod');
    return astTransformedCode;
};
