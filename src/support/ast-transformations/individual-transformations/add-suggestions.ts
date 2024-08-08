import type {
    Collection,
    JSCodeshift,
    Identifier,
    MemberExpression,
    ASTPath,
} from 'jscodeshift';
import { addComment } from '../utils/add-comment';
import { astLogger } from '../utils/ast-logger';
import { generateSuggestion } from '../utils/conversion-suggestions';

/**
 * Find the Enzyme methods based on renderFunctionVarNames and add suggestions
 * @param j JSCodeshift
 * @param root Collection
 * @param renderFuncNameVarNames - array of variables referencing enzyme render function calls
 */
export const addSuggestions = (
    j: JSCodeshift,
    root: Collection,
    renderFuncNameVarNames: string[] | null,
): void => {
    if (renderFuncNameVarNames) {
        // Find all instances of renderFuncNameVarName (=EnzymeWrapper)
        // Add comments above and change to screen methods
        renderFuncNameVarNames.forEach((enzymeWrapperName) => {
            astLogger.verbose('Get all methods calls on EnzymeWrapper');
            const instancesOfEnzymeMethodCalls =
                queryRenderFunctionMethodCalls(enzymeWrapperName);
            astLogger.verbose(
                'Get the method name called on the the wrapper and add suggestions',
            );
            getMethodAndSuggest(
                instancesOfEnzymeMethodCalls,
                enzymeWrapperName,
            );
        });
    }

    /**
     * Get all calls to enzyme wrapper
     * @param enzymeWrapperName
     * @returns
     */
    function queryRenderFunctionMethodCalls(
        enzymeWrapperName: string,
    ): Collection {
        return root.find(j.CallExpression, {
            callee: {
                object: {
                    name: enzymeWrapperName,
                },
            },
        });
    }

    /**
     * Add suggestions to all enzyme method calls
     * @param collectionOfEnzymeMethodCalls 
     * @param enzymeWrapperName 
     */
    function getMethodAndSuggest(
        collectionOfEnzymeMethodCalls: Collection,
        enzymeWrapperName: string,
    ): void {
        collectionOfEnzymeMethodCalls.forEach((path) => {
            // Get enzyme method
            const enzymeMethod = getEnzymeMethod(path);

            // Get enzyme method args
            let enzymeMethodArgs: string | null = '';
            if (enzymeMethod) {
                enzymeMethodArgs = getEnzymeMethodArgs(path);
            }

            if (enzymeMethod && enzymeMethod !== 'find') {
                const suggestion = generateSuggestion(
                    enzymeWrapperName,
                    enzymeMethod,
                    enzymeMethodArgs,
                );
                addComment(path, suggestion);
            }
        });
    }

    /**
     * Get enzyme method
     * @param path
     * @returns
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getEnzymeMethod(path: ASTPath<any>): string | null {
        try {
            const calleeProperty = path.node.callee as MemberExpression;
            const expressionArg = calleeProperty.property as Identifier;
            return expressionArg.name;
        } catch {
            return null;
        }
    }

    /**
     * Get enzyme method args
     * @param path
     * @returns
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getEnzymeMethodArgs(path: ASTPath<any>): string | null {
        try {
            const wrapperMethodArgsNode = path.node.arguments[0];
            const argsCode = j(wrapperMethodArgsNode).toSource();
            return argsCode;
        } catch {
            return null;
        }
    }
};
