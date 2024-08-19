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
    testId: string,
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
    let fileTopNode = root.find(j.Program);

    // Add RTL imports
    astLogger.verbose('Add RTL import');
    fileTopNode.replaceWith((path) => {
        path.node.body.unshift(newImportDeclaration);
        return path.node;
    });

    // Create import '@testing-library/jest-dom';
    const jestDomImport = j.importDeclaration(
        [],
        j.literal('@testing-library/jest-dom'),
    );

    // Create import { configure } from '@testing-library/dom';
    const configureImport = j.importDeclaration(
        [j.importSpecifier(j.identifier('configure'))],
        j.literal('@testing-library/dom'),
    );

    // Create configure({ testIdAttribute: 'test-id' });
    const configureCall = j.expressionStatement(
        j.callExpression(j.identifier('configure'), [
            j.objectExpression([
                j.property(
                    'init',
                    j.identifier('testIdAttribute'),
                    j.literal(testId),
                ),
            ]),
        ]),
    );

    // Get the top of the file to insert the new imports and configuration
    fileTopNode = root.find(j.Program);

    // Insert the statements in the correct order
    astLogger.verbose(
        'Inserting @testing-library/jest-dom, configure import, and configure call',
    );
    fileTopNode.replaceWith((path) => {
        path.node.body.unshift(configureCall); // Step 3: Insert configure call
        path.node.body.unshift(configureImport); // Step 2: Insert configure import
        path.node.body.unshift(jestDomImport); // Step 1: Insert jest-dom import
        return path.node;
    });
};
