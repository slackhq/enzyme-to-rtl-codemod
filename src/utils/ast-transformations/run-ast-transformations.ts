import fs from 'fs';
import { mainTransform } from './main-ast-transform';
import { astLogger } from './utils/ast-logger';
import {
    getConfigProperty,
    checkConfiguration,
    addPathsToConfig,
} from '../config';

/**
 * Run jscodeshift and make AST conversions
 * @param filePath
 * @returns
 */
export const getASTCodemodCode = (filePath: string): string => {
    // Check if config is set
    checkConfiguration(filePath);

    // Add to configuration
    addPathsToConfig(filePath);

    // Run main transformation function in jscodeshift
    astLogger.info('Start: Running AST codemod');
    const astTransformedCode = mainTransform(filePath);

    // Get ast transformed file path
    const astConvertedFilePath = `${getConfigProperty('astTranformedFilePath')}`;
    astLogger.info(`Writing AST transformed code to ${astConvertedFilePath}`);
    fs.writeFileSync(astConvertedFilePath, astTransformedCode, 'utf8');

    astLogger.info('Done: Running AST codemod');
    return astTransformedCode;
};
