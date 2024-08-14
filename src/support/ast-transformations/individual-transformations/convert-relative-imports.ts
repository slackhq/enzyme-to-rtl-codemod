import type { Collection, JSCodeshift } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';
import path from 'path';

/**
 * Convert relative imports to absolute imports in both import declarations and jest.mock calls.
 * @param j
 * @param root
 * @param enzymeFilePath
 */
export const convertRelativeImports = (
    j: JSCodeshift,
    root: Collection,
    enzymeFilePath: string,
): void => {
    const convertPathToAbsolute = (
        relativePath: string,
        basePath: string,
    ): string => {
        const rootFolder = process.cwd();
        const absoluteBasePath = path.resolve(rootFolder, basePath);
        const absoluteSrcDir = path.dirname(absoluteBasePath);
        return path.resolve(absoluteSrcDir, relativePath);
    };

    // Convert relative paths in import declarations
    astLogger.verbose('Convert relative import paths');
    root.find(j.ImportDeclaration).forEach((astPath) => {
        const importPath = astPath.node.source.value as string;
        if (
            importPath.startsWith('.') &&
            !importPath.includes('./enzyme-mount-adapter')
        ) {
            const absoluteImportPath = convertPathToAbsolute(
                importPath,
                enzymeFilePath,
            );
            astPath.node.source.value = absoluteImportPath;
            astLogger.verbose(
                `Changed import ${importPath} to ${absoluteImportPath}`,
            );
        }
    });

    // Convert relative paths in jest.mock
    root.find(j.CallExpression, {
        callee: {
            object: {
                name: 'jest',
            },
            property: {
                name: 'mock',
            },
        },
    }).forEach((astPath) => {
        const arg = astPath.value.arguments[0];
        if (j.StringLiteral.check(arg)) {
            const argValue = arg.value;
            if (argValue.startsWith('.')) {
                const absoluteJestMockPath = convertPathToAbsolute(
                    argValue,
                    enzymeFilePath,
                );
                arg.value = absoluteJestMockPath;
                astLogger.verbose(
                    `Changed jest.mock path ${argValue} to ${absoluteJestMockPath}`,
                );
            }
        }
    });
};
