/**
 * Function locates `toEqual|toContain|toBe()` and converts toHaveTextContent()
 * Ex. expect(wrapper.find('selector').text()).toEqual('Expected text'); -> expect(wrapper.find('selector')).toHaveTextContent('Expected text');
 */

import type { Collection, JSCodeshift, CallExpression } from 'jscodeshift';

export const getAllTextConversion = (
    j: JSCodeshift,
    root: Collection<CallExpression>,
) => {
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

export const convertText = (j: JSCodeshift, root: Collection) => {
    const textCallExpressions = getAllTextConversion(j, root);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    textCallExpressions.replaceWith(({ node }: { node: any }) => {
        const resultIdentifier = node.callee.object.arguments[0].callee.object;

        return j.callExpression(
            j.memberExpression(
                j.callExpression(j.identifier('expect'), [resultIdentifier]),
                j.identifier('toHaveTextContent'),
            ),
            [node.arguments[0]],
        );
    });
};
