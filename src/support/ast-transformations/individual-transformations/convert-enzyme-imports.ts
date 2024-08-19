/**
 * Find and convert all Enzyme import declarations to RTL imports
 * Example:
 * import { shallow } from 'enzyme'; --> import { render, screen } from '@testing-library/react';
 */

import type { Collection, JSCodeshift, ImportDeclaration } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Transform the provided AST by converting all Enzyme imports to RTL imports
 * @param j
 * @param root
 * @param testId
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

    // Always remove enzyme imports
    if (enzymeImportDeclaration.length > 0) {
        enzymeImportDeclaration.remove();
    } else {
        astLogger.verbose('No enzyme imports found');
    }

    // Create new import declaration for `import { render, screen, configure } from '@testing-library/react';`
    const rtlImportDeclaration = j.importDeclaration(
        [
            j.importSpecifier(j.identifier('render')),
            j.importSpecifier(j.identifier('screen')),
            j.importSpecifier(j.identifier('configure')),
        ],
        j.literal('@testing-library/react'),
    );

    // Create import '@testing-library/jest-dom';
    const jestDomImport = j.importDeclaration(
        [],
        j.literal('@testing-library/jest-dom'),
    );

    // Create configure({ testIdAttribute: testId });
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
    const fileTopNode = root.find(j.Program);

    // Insert the statements in the correct order
    astLogger.verbose(
        'Inserting RTL imports, @testing-library/jest-dom, and configure call',
    );
    fileTopNode.replaceWith((path) => {
        path.node.body.unshift(configureCall);
        path.node.body.unshift(jestDomImport);
        path.node.body.unshift(rtlImportDeclaration);
        return path.node;
    });
};
