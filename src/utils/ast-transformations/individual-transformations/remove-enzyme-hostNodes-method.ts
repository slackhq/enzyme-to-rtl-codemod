/**
 * Function locates and remove calls to `hostNodes` from method chains.
 * Ex. wrapper.find('div').hostNodes().toHaveLength(1); -> wrapper.find('div').toHaveLength(1);
 */

import { JSCodeshift, Collection } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Transforms the provided AST by removing all `.hostNodes()` method calls from Enzyme selectors.
 * @param j - JSCodeshift library
 * @param root - root AST node
 * @returns {void} - The function does not return a value but mutates the AST directly.
 */
export const convertHostNodes = (j: JSCodeshift, root: Collection) => {
    // Find the hostNodes call expression within the provided AST root
    astLogger.verbose('Query for hostNodes');
    root.find(j.CallExpression, {
        callee: {
            property: { name: 'hostNodes' }, // Targeting calls that contain .hostNodes()
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).replaceWith((path: any) => path.node.callee.object);
};
