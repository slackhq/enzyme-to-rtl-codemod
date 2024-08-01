/**
 * Function locates and remove calls to `update()` from method chains.
 * Ex. wrapper.find('[role="listbox"]').simulate('click').update(); -> wrapper.find('[role="listbox"]').simulate('click');
 *
 * If the `.update()` call is the entire expression of a statement, removes that statement.
 * Ex. wrapper.update(); -> Line removed
 */

import type {
    ASTPath,
    CallExpression,
    Collection,
    JSCodeshift,
    MemberExpression,
} from 'jscodeshift';

/**
 * Transforms the provided AST by removing all `.update()` method calls from Enzyme selectors.
 * @param j - JSCodeshift library
 * @param root - The root AST node
 * @returns {void} - The function does not return a value but mutates the AST directly.
 */

export const convertUpdate = (j: JSCodeshift, root: Collection): void => {
    // Find wrapper calls with wrapper.update()
    const updateWrapperCalls = root.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            object: {
                type: 'Identifier',
            },
            property: {
                type: 'Identifier',
                name: 'update',
            },
        },
    });

    // For instances where the wrapper.update() call is the entire expression, remove the entire line
    if (updateWrapperCalls.length > 0) {
        updateWrapperCalls.remove();
    }

    // Find the remaining .update() calls remaining in the test file - e.g. wrapper.find('[role="listbox"]').simulate('click').update();
    const remainingUpdateCalls = root.find(j.CallExpression, {
        callee: {
            property: {
                name: 'update',
            },
        },
    });

    // For remaining .update() instances found, only remove the function call
    if (remainingUpdateCalls.length > 0) {
        remainingUpdateCalls.replaceWith((path: ASTPath<CallExpression>) => {
            const calleeObject = (path.node.callee as MemberExpression).object;
            return calleeObject;
        });
    }
};
