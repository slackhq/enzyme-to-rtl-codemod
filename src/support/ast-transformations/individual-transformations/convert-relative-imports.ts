/**
 * Find and convert all relative import declarations to absolute imports
 * Example:
 * import { method } from '../../utils'; --> import { method } from '<absoluteImport>';
 */

import type { Collection, JSCodeshift } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';
import path from 'path';

/**
 *  Convert relative with absolute imports to enable running files in a temp folder
 * @param j
 * @param root
 * @param enzymeFilePath
 */
export const convertRelativeImports = (
    j: JSCodeshift,
    root: Collection,
    enzymeFilePath: string,
): void => {
    // Deal with relative imports
    astLogger.verbose('Convert relative import paths');
    root.find(j.ImportDeclaration).forEach((astPath) => {
        const importPath = astPath.node.source.value as string;

        if (
            importPath.startsWith('.') &&
            !importPath.includes('./enzyme-mount-adapter')
        ) {
            const rootFolder = process.cwd();

            // Get the absolute path of the enzyme file in host project
            const absoluteEnzymeFilePath = path.resolve(
                rootFolder,
                enzymeFilePath,
            );

            // Get the directory containing the current file
            const absoluteSrcDir = path.dirname(absoluteEnzymeFilePath);

            // Resolve the import path relative to the current file's directory
            const absoluteImportPath = path.resolve(absoluteSrcDir, importPath);
            astPath.node.source.value = absoluteImportPath;
            astLogger.verbose(`Changed ${importPath} to ${absoluteImportPath}`);
        }
    });
};
