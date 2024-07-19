/**
 * Query .find method calls and convert
 * 1. find('selector')
 * 1.1. if selector is a testid, getByTestID
 * 1.2. if selector is a role, getByRole
 * 1.3. if selector is a component, annotation
 */

import { JSCodeshift, Collection, CallExpression, ASTPath } from 'jscodeshift';
import { addComment } from '../utils/add-comment';
import { astLogger } from '../utils/ast-logger';

/**
 * Convert Enzyme find method
 * @param j
 * @param root
 */
export const convertFind = (j: JSCodeshift, root: Collection) => {
    astLogger.verbose('Querying for .find');
    // Find all call expressions with the callee property name 'find'
    const findCalls = root.find(j.CallExpression, {
        callee: {
            property: {
                name: 'find',
            },
        },
    });

    astLogger.verbose('Converting .find');
    // Iterate over each found call expression path and convert/annotate
    findCalls.forEach((path: ASTPath<CallExpression>) => {
        addComment(
            path,
            '/* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/',
        );
    });
};
