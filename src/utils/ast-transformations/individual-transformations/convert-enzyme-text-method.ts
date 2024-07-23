/**
 * Function locates `toEqual|toContain|toBe()` and converts to toHaveTextContent()
 * Ex. expect(wrapper.find('selector').text()).toEqual('Expected text'); -> expect(wrapper.find('selector')).toHaveTextContent('Expected text');
 */

import type { Collection, JSCodeshift, CallExpression } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Locates `toEqual|toContain|toBe` method enclosed in 'expect' function calls.
 * @param j - JSCodeshift library
 * @param root - root AST node
 * @returns - All instances of toEqual|toContain|toBe
 */
const getAllTextConversion = (
    j: JSCodeshift,
    root: Collection<CallExpression>,
): Collection<CallExpression> => {
    astLogger.verbose('Query for toEqual|toContain|toBe calls');
    return root.find(j.CallExpression, {
        callee: {
            object: {
                callee: {
                    name: 'expect',
                },
                arguments: [
                    {
                        callee: {
                            property: {
                                name: 'text',
                            },
                        },
                    },
                ],
            },
            property: /^(toEqual|toContain|toBe)$/,
        },
    });
};

/**
 * Transforms the provided AST by converting text method calls to 'toHaveTextContent()'.
 * @param j - JSCodeshift library
 * @param root - root AST node
 * @returns - Returns toHaveTextContent() method call
 */
export const convertText = (j: JSCodeshift, root: Collection) => {
    const textCallExpressions = getAllTextConversion(j, root);

    textCallExpressions.replaceWith(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ node }: { node: any }): CallExpression => {
            const resultIdentifier =
                node.callee.object.arguments[0].callee.object;

            astLogger.verbose(
                'Transforms toHaveTextContent within the expect assertion',
            );
            return j.callExpression(
                j.memberExpression(
                    j.callExpression(j.identifier('expect'), [
                        resultIdentifier,
                    ]),
                    j.identifier('toHaveTextContent'),
                ),
                [node.arguments[0]],
            );
        },
    );
};
