/**
 * Find and convert all Enzyme import declarations to RTL imports
 * Example:
 * import { shallow } from 'enzyme'; --> import { render, screen } from '@testing-library/react';
 */

import type { Collection, JSCodeshift, ImportDeclaration } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';
import path from 'path';

/**
 *  Transforms the provided AST by converting all Enzyme imports to RTL imports.
 *  - transform relative imports
 * @param j
 * @param root
 * @param enzymeFilePath
 */
export const convertImports = (
    j: JSCodeshift,
    root: Collection,
    enzymeFilePath: string,
): void => {
    // Find all import declarations matching `import { shallow } from 'enzyme';`
    astLogger.verbose('Query for enzyme import declarations');
    const enzymeImportDeclaration = root.find(j.ImportDeclaration, {
        source: {
            value: 'enzyme',
        },
    });

    let newImportDeclaration: ImportDeclaration;

    // Replace shallow and mount imports with import screen and render from rtl
    astLogger.verbose(
        'Convert shallow and mount imports with import screen and render from rtl',
    );
    if (enzymeImportDeclaration.length > 0) {
        // create new import declaration for `import { render, screen } from '@testing-library/react';`
        newImportDeclaration = j.importDeclaration(
            [
                j.importSpecifier(j.identifier('render')),
                j.importSpecifier(j.identifier('screen')),
            ],
            j.literal('@testing-library/react'),
        );

        // remove enzyme imports
        enzymeImportDeclaration.remove();
    } else {
        astLogger.verbose('No enzyme imports found');
    }

    // Get the top file node
    const fileTopNode = root.find(j.Program);

    // Add the new import
    astLogger.verbose('Add RTL import');
    fileTopNode.replaceWith((path) => {
        path.node.body.unshift(newImportDeclaration);
        return path.node;
    });

    // Deal with relative imports
    astLogger.verbose('Update relative import paths');
    root.find(j.ImportDeclaration).forEach((astPath) => {
        const importPath = astPath.node.source.value as string;

        if (importPath.startsWith('.')) {
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
