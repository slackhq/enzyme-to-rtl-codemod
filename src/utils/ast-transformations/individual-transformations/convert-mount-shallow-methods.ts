/**
 * Convert mount(args) and shallow(args) to render(args)
 * Return abstracted function name that calls .mount and .shallow methods
 * Example:
 * function abstractedFunction(props: {} = {}) {
		return shallow(<ReactComponent {...props} />);
	}
 * Assumption: only one method is used: mount or shallow, but not both. 
 * TODO: fix this by collecting all the matched queries and return an array. See removeMountAndShallow.jest.tsx with all tests active
 */

import { JSCodeshift, Collection, CallExpression } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Convert mount and shallow Enzyme methods
 * @param j
 * @param root
 */
export const convertMountShallowMethods = (
    j: JSCodeshift,
    root: Collection,
): string | null => {
    // Find shallow call expression
    astLogger.verbose('Query for shallow');
    const shallowCall = root.find(j.CallExpression, {
        callee: {
            type: 'Identifier',
            name: 'shallow',
        },
    });

    // Find mount call expression
    astLogger.verbose('Query for mount');
    const mountCall = root.find(j.CallExpression, {
        callee: {
            type: 'Identifier',
            name: 'mount',
        },
    });

    let matchedQuery: Collection;
    let declarationIdNode;

    astLogger.verbose('Check if shallow or mount are present in code');
    if (shallowCall.length) {
        matchedQuery = shallowCall;
    } else if (mountCall.length) {
        matchedQuery = mountCall;
    } else {
        astLogger.warn(
            'Did not find any Enzyme rendering methods: mount, shallow. Please make sure shallow/mount are not abstracted in a method outside of this test file and is imported directly from enzyme. Continuing without it...',
        );
        return null;
    }

    /**
     * Check if the mount/shallow method call is inside a FunctionDeclaration
     * Example:
     * function mountComponent() {... mount() ...}
     */
    if (matchedQuery.closest(j.FunctionDeclaration).length > 0) {
        astLogger.verbose('Found shallow/mount in FunctionDeclaration');
        // Get FunctionDeclaration node
        const functionNode = matchedQuery.closest(j.FunctionDeclaration);

        // Get FunctionDeclaration Identifier node
        declarationIdNode = functionNode.get('paths').node.id;
        /**
         * Check if the mount/shallow method call is a VariableDeclaration
         * Example:
         * const mountComponent = () => {... mount() ...}
         * const mountComponent = mount()
         */
    } else if (matchedQuery.closest(j.VariableDeclaration).length > 0) {
        astLogger.verbose('Found shallow/mount in VariableDeclaration');
        // Get variable declaration node
        const varDeclarationNode = matchedQuery.closest(j.VariableDeclaration);

        // Get VariableDeclaration Identifier node
        declarationIdNode = varDeclarationNode.get(
            'declarations',
            0,
            'id',
        ).node;
        /**
         * TODO: check on more examples
         * Check if the mount/shallow method call is a AssignmentExpression
         * Example:
         * let mountComponent;
         * mountComponent = function() {... mount() ...};
         */
    } else if (matchedQuery.closest(j.AssignmentExpression).length > 0) {
        astLogger.verbose('Found shallow/mount in AssignmentExpression');
        // Get AssignmentExpression node
        const assignmentNode = matchedQuery.closest(j.AssignmentExpression);

        // Get the left-hand side of the AssignmentExpression
        const lhs = assignmentNode.get('left').node;

        // Get Identifier node from the left-hand side
        if (lhs.type === 'Identifier') {
            declarationIdNode = lhs;
        }
    }

    // Extract the variable name from the identifier node
    let renderFunction = declarationIdNode.name;

    // Replace render with renderFunc to avoid conflict with rtl render
    if (renderFunction === 'render') {
        astLogger.verbose('Found abstracted function named "render"');
        renderFunction = 'renderFunc';
        declarationIdNode.name = renderFunction;
        changeRenderFuncName();
        astLogger.verbose('Renamed abstracted function to "renderFunc"');
    }

    // TODO: test on more file to make sure it works
    // Convert mount(args) and shallow (args) function calls to render(args)
    astLogger.verbose('Convert mount(args) and shallow (args) to render(args)');
    matchedQuery.replaceWith(({ node }: { node: CallExpression }) => {
        return j.callExpression(j.identifier('render'), node.arguments);
    });

    /**
     * Sometimes the function that calls mount or shallow method is called render
     * To avoid any conflicts with RTL we need to rename it to something else than render
     */
    function changeRenderFuncName() {
        // Find all calls to that function and change to the new value
        const renderFuncReferenceDeclarations = root.find(j.CallExpression, {
            callee: {
                name: 'render',
            },
        });

        renderFuncReferenceDeclarations.replaceWith(({ node }) => {
            return j.callExpression(
                j.identifier(renderFunction),
                node.arguments,
            );
        });
    }
    return renderFunction;
};
