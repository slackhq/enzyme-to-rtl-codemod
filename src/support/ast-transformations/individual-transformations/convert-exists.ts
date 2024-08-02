/**
 * Finds and convert all exists() actions to equivalent Jest-DOM action - toBeInTheDocument() 
 * Examples:
    exists()).toBe(true)   -> toBeInTheDocument()
    exists()).toBe(false)  -> not.toBeInTheDocument()
    exists()).toBeTruthy() -> toBeInTheDocument()
    exists()).toBeFalsy()  -> not.toBeInTheDocument()
 */

import type {
    Collection,
    JSCodeshift,
    CallExpression,
    ASTPath,
    MemberExpression,
} from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Transforms the provided AST by converting all exists() calls Jest DOM Matcher - toBeInTheDocument()
 * @param j - JSCodeshift library
 * @param root - The root AST node
 * @returns {void} - The function does not return a value but mutates the AST directly.
 */
export const convertExists = (j: JSCodeshift, root: Collection): void => {
    // Check if there are any .exists() method
    astLogger.verbose('Query for exists() method calls');
    const existCalls = root.find(j.CallExpression, {
        callee: {
            property: { name: 'exists' },
        },
    });

    // Iterate .exists() Calls
    astLogger.verbose('Iterate .exists() calls');
    existCalls.forEach((path: ASTPath<CallExpression>) => {
        if (path.node.arguments.length === 0) {
            // Find the closest ancestor CallExpression with type identifier and argument is set to true, in the method exists().toBe(true)
            astLogger.verbose('Query for .toBe(true) method calls');
            const toBeTruePath = j(path).closest(j.CallExpression, {
                callee: {
                    property: { type: 'Identifier', name: 'toBe' },
                },
                arguments: [{ value: true }],
            });
            // Replace .toBe(true) with .toBeInTheDocument()
            astLogger.verbose(
                'Transform .toBe(true) calls to .toBeInTheDocument()',
            );
            if (toBeTruePath.length > 0) {
                toBeTruePath.replaceWith(
                    ({ node }: { node: CallExpression }) => {
                        return j.callExpression(
                            j.memberExpression(
                                (node.callee as MemberExpression).object,
                                j.identifier('toBeInTheDocument'),
                            ),
                            [],
                        );
                    },
                );
            }

            // Find the closest ancestor CallExpression with type identifier and argument is set to false, in the method exists().toBe(false)
            astLogger.verbose('Query for .toBe(false) method calls');
            const toBeFalsePath = j(path).closest(j.CallExpression, {
                callee: {
                    property: { type: 'Identifier', name: 'toBe' },
                },
                arguments: [{ value: false }],
            });
            // Replace .toBe(false) with .not.toBeInTheDocument()
            astLogger.verbose(
                'Transform .toBe(false) calls to not.toBeInTheDocument()',
            );
            if (toBeFalsePath.length > 0) {
                toBeFalsePath.replaceWith(
                    ({ node }: { node: CallExpression }) => {
                        return j.callExpression(
                            j.memberExpression(
                                j.memberExpression(
                                    (node.callee as MemberExpression).object,
                                    j.identifier('not'),
                                ),
                                j.identifier('toBeInTheDocument'),
                            ),
                            [],
                        );
                    },
                );
            }

            // Find the closest ancestor CallExpression with type identifier and argument is set to true, in the method exists().toEqual(true)
            astLogger.verbose('Query for .toEqual(true) method calls');
            const toEqualTruePath = j(path).closest(j.CallExpression, {
                callee: {
                    property: { type: 'Identifier', name: 'toEqual' },
                },
                arguments: [{ value: true }],
            });
            // Replace exists().toEqual(true) with .toBeInTheDocument()
            astLogger.verbose(
                'Transform .toEqual(true) calls to toBeInTheDocument()',
            );
            if (toEqualTruePath.length > 0) {
                toEqualTruePath.replaceWith(
                    ({ node }: { node: CallExpression }) => {
                        return j.callExpression(
                            j.memberExpression(
                                (node.callee as MemberExpression).object,
                                j.identifier('toBeInTheDocument'),
                            ),
                            [],
                        );
                    },
                );
            }

            // Find the closest ancestor CallExpression with type identifier and argument is set to false, in the method exists().toEqual(false)
            astLogger.verbose('Query for .toEqual(false) method calls');
            const toEqualFalsePath = j(path).closest(j.CallExpression, {
                callee: {
                    property: { type: 'Identifier', name: 'toEqual' },
                },
                arguments: [{ value: false }],
            });
            // Replace .toEqual(false) with .not.toBeInTheDocument()
            astLogger.verbose(
                'Transform .toEqual(false) calls to not.toBeInTheDocument()',
            );
            if (toEqualFalsePath.length > 0) {
                toEqualFalsePath.replaceWith(
                    ({ node }: { node: CallExpression }) => {
                        return j.callExpression(
                            j.memberExpression(
                                j.memberExpression(
                                    (node.callee as MemberExpression).object,
                                    j.identifier('not'),
                                ),
                                j.identifier('toBeInTheDocument'),
                            ),
                            [],
                        );
                    },
                );
            }

            // Find the closest ancestor CallExpression with type identifier and argument is set to true, in the method exists().toBeTruthy
            astLogger.verbose('Query for .toBeTruthy() method calls');
            const toBeTruthyPath = j(path).closest(j.CallExpression, {
                callee: {
                    property: { name: 'toBeTruthy' },
                },
            });
            // Replace .toBeTruthy with .toBeInTheDocument()
            astLogger.verbose(
                'Transform .toBeTruthy() calls to .toBeInTheDocument()',
            );
            if (toBeTruthyPath.length > 0) {
                toBeTruthyPath.replaceWith(
                    ({ node }: { node: CallExpression }) => {
                        return j.callExpression(
                            j.memberExpression(
                                (node.callee as MemberExpression).object,
                                j.identifier('toBeInTheDocument'),
                            ),
                            [],
                        );
                    },
                );
            }

            // Find the closest ancestor CallExpression with type identifier and argument is set to false, in the method exists().toBeFalsy
            astLogger.verbose('Query for .toBeFalsy() method calls');
            const toBeFalsyPath = j(path).closest(j.CallExpression, {
                callee: {
                    property: { name: 'toBeFalsy' },
                },
            });
            // Replace .toBeFalsy with .not.toBeInTheDocument()
            astLogger.verbose(
                'Transform .toBeFalsy() calls to not.toBeInTheDocument()',
            );
            if (toBeFalsyPath.length > 0) {
                toBeFalsyPath.replaceWith(
                    ({ node }: { node: CallExpression }) => {
                        return j.callExpression(
                            j.memberExpression(
                                j.memberExpression(
                                    (node.callee as MemberExpression).object,
                                    j.identifier('not'),
                                ),
                                j.identifier('toBeInTheDocument'),
                            ),
                            [],
                        );
                    },
                );
            }
            // Remove .exists()
            astLogger.verbose('Remove .exists()');
            path.replace((path.node.callee as MemberExpression).object);
        }
    });
};
