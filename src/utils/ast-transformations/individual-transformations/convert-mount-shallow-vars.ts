/**
 * Find and return all variables that store enzyme shallow or mount function calls
 * Remove variable declarations that store shalllow or mount
 * Example:
 * const wrapper = abstractedFunction(); --> abstractedFunction();
 */

import type { Collection, JSCodeshift, Identifier, ASTPath } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Convert variables that store mount and shallow
 * @param j
 * @param root
 * @param renderFunction
 * @returns
 */
export const convertMountShallowVars = (
    j: JSCodeshift,
    root: Collection,
    renderFunction: string | null,
): string[] | null => {
    if (!renderFunction) {
        astLogger.warn('No abstracted renderFunction was found. Conitnue...');
        return null;
    }
    // Array for all variables storing enzyme shallow or mount function calls
    const varsRenderRefs: string[] = [];

    /**
     * Find all variable declarations that store shallow or mount function calls
     * Example:
     * const wrapper = abstractedFunction();
     */
    astLogger.verbose(`Query for VariableDeclaration with ${renderFunction}`);
    const renderFuncReferenceDeclarations = root.find(j.VariableDeclaration, {
        declarations: [
            {
                init: {
                    type: 'CallExpression',
                    callee: {
                        name: renderFunction,
                    },
                },
            },
        ],
    });

    /**
     * Get an array of variable declarations referencing render functions
     * Remove the variables
     * Example:
     * const wrapper = abstractedFunction(); --> abstractedFunction();
     */
    astLogger.verbose(
        'Removing VariableDeclaration and collecting variable name',
    );
    renderFuncReferenceDeclarations.forEach((path) => {
        replaceWithExpression(path);
    });

    /**
     * Find all variable assignments that store the render function call
     * Example:
     * let mountedComponent;
     * mountedComponent = abstractedFunction();
     */
    astLogger.verbose(`Query for AssignmentExpression with ${renderFunction}`);
    const renderFuncAssignmentExpressions = root.find(j.AssignmentExpression, {
        operator: '=',
        right: {
            type: 'CallExpression',
            callee: {
                name: renderFunction,
            },
        },
    });

    /**
     * Get an array of variable assignments referencing render functions
     * Remove the variables
     */
    astLogger.verbose(
        'Removing AssignmentExpression and collecting variable name',
    );
    renderFuncAssignmentExpressions.forEach((path) => {
        const left = path.node.left as Identifier;
        varsRenderRefs.push(left.name);

        // Remove variable declaration
        // TODO: test on more examples
        root.find(j.VariableDeclarator, {
            id: { name: left.name },
        }).remove();

        // Replace found nodes with whatever goes right after the "=" sign
        const right = path.node.right;
        j(path).replaceWith(right);
    });

    /**
     * If renderFuncReferenceDeclarations and renderFuncAssignmentExpressions are empty,
     * mount/shallow methods are not abstracted in another method
     */
    if (
        renderFuncReferenceDeclarations.length === 0 &&
        renderFuncAssignmentExpressions.length === 0
    ) {
        astLogger.verbose(
            'No VariableDeclaration or AssignmentExpression with abstracted function found',
        );
        /**
         * Find all variable declarations that store mount/shallow function call without abstraction
         * Example:
         * const wrapper = shallow(<Component />);
         */
        astLogger.verbose(
            `Query for VariableDeclaration with direct calls to shallow/mouint with ${renderFunction}`,
        );
        const renderFuncReferenceDeclarationsDirect = root.find(
            j.VariableDeclaration,
            {
                declarations: [
                    {
                        id: {
                            name: renderFunction,
                        },
                    },
                ],
            },
        );

        // Get an array of variable declarations with direct calls to mount/shallow
        astLogger.verbose(
            'Removing VariableDeclaration and collecting variable name',
        );
        renderFuncReferenceDeclarationsDirect.forEach((path) => {
            replaceWithExpression(path);
        });

        /**
         * Find the cases where the const is an object deconstruction
         * TODO: find the example for this one. Not sure where this one applies
         */
        astLogger.verbose(
            `Query for VariableDeclaration with deconstructed object with ${renderFunction}`,
        );
        const renderFuncReferenceDeclarationsDestructured = root.find(
            j.VariableDeclaration,
            {
                declarations: [
                    {
                        id: {
                            type: 'ObjectPattern',
                        },
                        init: {
                            argument: {
                                type: 'CallExpression',
                                callee: {
                                    name: renderFunction,
                                },
                            },
                        },
                    },
                ],
            },
        );

        // Get an array of variables referencing render functions
        renderFuncReferenceDeclarationsDestructured.forEach((path) => {
            astLogger.verbose(
                'Removing VariableDeclaration with deconstructed object',
            );
            replaceWithExpression(path);
        });
    }

    /**
     * Construct and replace with new expression
     * @param path
     */
    function replaceWithExpression(path: ASTPath): void {
        // Get the declaration and add to the variable refs
        const varDeclarationNode = path.get('declarations', 0, 'id').node;
        varsRenderRefs.push(varDeclarationNode.name);

        // Get node init
        const varDeclarationInit = path.get('declarations', 0, 'init').node;

        // Create a new expression with the init (everything after the = sign)
        const expressionStatement = j.expressionStatement(varDeclarationInit);

        // Replace the `VariableDeclaration` with the new expression statement
        j(path).replaceWith(expressionStatement);
    }

    // Get list of unique variable names
    astLogger.verbose('Deduplicating variable names');
    const varsRenderRefsUnique = varsRenderRefs.filter((elem, index, self) => {
        return index === self.indexOf(elem);
    });

    return varsRenderRefsUnique;
};
