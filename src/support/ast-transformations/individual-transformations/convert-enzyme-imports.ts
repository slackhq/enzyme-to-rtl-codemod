/**
 * Find and convert all Enzyme import declarations to RTL imports
 * Example:
 * import { shallow } from 'enzyme'; --> import { render, screen } from '@testing-library/react';
 */

import type { Collection, JSCodeshift, ImportDeclaration } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 *  Transforms the provided AST by converting all Enzyme imports to RTL imports.
 * @param j
 * @param root
 */
export const convertEnzymeImports = (
    j: JSCodeshift,
    root: Collection,
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
};
