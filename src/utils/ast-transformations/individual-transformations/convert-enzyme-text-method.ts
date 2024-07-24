/**
 * Function locates `toEqual|toContain|toBe()` and converts to toHaveTextContent()
 * Ex. expect(wrapper.find('selector').text()).toEqual('Expected text'); -> expect(wrapper.find('selector')).toHaveTextContent('Expected text');
 */

import type {
    Collection,
    JSCodeshift,
    CallExpression,
    MemberExpression,
} from 'jscodeshift';
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

    textCallExpressions.replaceWith(
        ({ node }: { node: CallExpression }): CallExpression => {
            // First, check if the callee is a MemberExpression
            if (node.callee.type === 'MemberExpression') {
                const memberCallee = node.callee as MemberExpression;

                // Next, check if the memberCallee.object is a CallExpression
                if (memberCallee.object.type === 'CallExpression') {
                    const objectCallExpression =
                        memberCallee.object as CallExpression;

                    // Further, check if the first argument of the object call is itself a CallExpression
                    if (
                        objectCallExpression.arguments[0] &&
                        objectCallExpression.arguments[0].type ===
                            'CallExpression'
                    ) {
                        const firstArgCallExpression = objectCallExpression
                            .arguments[0] as CallExpression;

                        // Finally, check if the callee of the first argument is a MemberExpression
                        if (
                            firstArgCallExpression.callee.type ===
                            'MemberExpression'
                        ) {
                            const innerMemberExpression =
                                firstArgCallExpression.callee as MemberExpression;
                            const resultIdentifier =
                                innerMemberExpression.object; // Safely access the nested object

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
            }
            // Return the node unmodified if any conditions fail
            return node;
        },
    );
};
