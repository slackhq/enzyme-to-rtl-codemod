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
export const convertText = (j: JSCodeshift, root: Collection): void => {
    const textCallExpressions = getAllTextConversion(j, root);

    textCallExpressions.replaceWith(({ node }: { node: CallExpression }) => {
        // First, check if the callee is a MemberExpression
        if (j.MemberExpression.check(node.callee)) {
            const memberCallee = node.callee;

            // Next, check if the memberCallee.object is a CallExpression
            if (j.CallExpression.check(memberCallee.object)) {
                const objectCallExpression = memberCallee.object;

                // Further, check if the first argument of the object call is itself a CallExpression
                if (j.CallExpression.check(objectCallExpression.arguments[0])) {
                    const firstArgCallExpression =
                        objectCallExpression.arguments[0];

                    // Finally, check if the callee of the first argument is a MemberExpression
                    if (
                        j.MemberExpression.check(firstArgCallExpression.callee)
                    ) {
                        const innerMemberExpression =
                            firstArgCallExpression.callee;
                        const resultIdentifier = innerMemberExpression.object; // Safely access the nested object

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
                    }
                }
            }
        } else {
            astLogger.error('Check this conversion.');
        }
    });
};
