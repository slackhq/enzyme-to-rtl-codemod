/**
 * Function locates and removes calls to `first()` from method chains.
 * Ex. wrapper.find('div').first().text().toEqual('Hello'); -> wrapper.find('div').text().toEqual('Hello');
 */

import type {
    Collection,
    JSCodeshift,
    ASTPath,
    CallExpression,
} from 'jscodeshift';

/**
 * Transforms the provided AST by removing all `.first()` method calls from Enzyme selectors.
 * @param j - JSCodeshift library
 * @param root - The root AST node
 * @returns {void} - The function does not return a value but mutates the AST directly.
 */
export const removeFirst = (j: JSCodeshift, root: Collection): void => {
    // Find the first() call expression within the provided AST root
    root.find<CallExpression>(j.CallExpression, {
        callee: {
            property: { name: 'first' },
        },
    }).replaceWith((path: ASTPath<CallExpression>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calleeObject = (path.node.callee as any).object; // Targeting calls that contain .first()
        return calleeObject;
    });
};
