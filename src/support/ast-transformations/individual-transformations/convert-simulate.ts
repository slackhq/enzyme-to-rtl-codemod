/**
 * Query .simulate method calls and convert to userEvent
 * Returns imported user-event from React Testing Library
 * Ex. component.getByText('Button').simulate('click'); -> userEvent.click(component.getByText('Button'));
 */

import type {
    Collection,
    JSCodeshift,
    ASTPath,
    CallExpression,
} from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';
import { addComment } from '../utils/add-comment';

/**
 * Transforms the provided AST by converting all `simulate` method calls to 'userEvent'.
 * Imports user-event from React Testing Library
 * @param j - JSCodeshift library
 * @param root - The root AST node
 * @returns - Returns imported userEvent Library
 */
export const convertSimulate = (j: JSCodeshift, root: Collection): void => {
    // Find all call expressions with the callee property name '.simulate'
    astLogger.verbose('Query for simulate');
    const simulateCalls = root.find(j.CallExpression, {
        callee: {
            property: {
                name: 'simulate',
            },
        },
    });

    // If an instance of .simulate is found, add the userEvent import
    astLogger.verbose('Check if simulate call is present in code');
    if (simulateCalls.length > 0) {
        const fileTopNode = root.find(j.Program);

        // Import userEvent
        fileTopNode.replaceWith((path) => {
            const newImportDeclaration = j.importDeclaration(
                [j.importDefaultSpecifier(j.identifier('userEvent'))],
                j.literal('@testing-library/user-event'),
            );
            astLogger.verbose('Import userEvent');
            path.node.body.unshift(newImportDeclaration);
            return path.node;
        });

        simulateCalls.forEach((path) => {
            const arg = path.value.arguments[0];
            if (arg && j.Literal.check(arg)) {
                const eventType = arg.value;

                // Check that the callee of .simulate is a MemberExpression
                astLogger.verbose(
                    'Verify callee of .simulate is a MemberExpression',
                );
                if (j.MemberExpression.check(path.value.callee)) {
                    astLogger.verbose(
                        'Extracting the object part of the MemberExpression',
                    );
                    const memberExpression = path.value.callee;
                    // Extract the object part of the MemberExpression
                    // eg. elementToInteract.simulate('click')
                    const elementToInteract = memberExpression.object;

                    // Choose the userEvent method based on the eventType
                    let userEventMethod = '';

                    switch (eventType) {
                        case 'click':
                            userEventMethod = 'click';
                            break;
                        case 'mouseenter':
                            userEventMethod = 'hover';
                            break;
                        case 'mouseEnter':
                            userEventMethod = 'hover';
                            break;
                        case 'mouseleave':
                            userEventMethod = 'unhover';
                            break;
                        case 'mouseLeave':
                            userEventMethod = 'unhover';
                            break;
                        // Can add more cases for other simulate events as needed
                        default:
                            break;
                    }

                    // Replace .simulate(eventType) with userEvent.{method}(elementToInteract)
                    astLogger.verbose('Convert .simulate to userEvent');
                    if (userEventMethod) {
                        const userEventAction = j.callExpression(
                            j.memberExpression(
                                j.identifier('userEvent'),
                                j.identifier(userEventMethod),
                            ),
                            [elementToInteract],
                        );

                        // Replace the original .simulate call with the userEvent action
                        j(path).replaceWith(userEventAction);
                        astLogger.verbose('Transformation complete.');
                    }
                    // If simulate event does not exist provides a suggestion
                    else {
                        // Iterate over each simulate call expression path and annotate
                        simulateCalls.forEach(
                            (path: ASTPath<CallExpression>) => {
                                addComment(
                                    path,
                                    "/* SUGGESTION: .simulate('<method>') --> userEvent.<method>(<DOM_element>); */",
                                );
                            },
                        );
                    }
                }
            }
        });
    }
};
