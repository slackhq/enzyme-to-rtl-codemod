import type {
    Collection,
    JSCodeshift,
    Identifier,
    MemberExpression,
    ASTPath,
} from 'jscodeshift';
import { convertSelector } from '../utils/selectors-logic';
import { addComment } from '../utils/add-comment';

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
    testId: string,
) => {
    if (renderFuncNameVarNames) {
        // Find all instances of renderFuncNameVarName (=EnzymeWrapper)
        // Add comments above and change to screen methods
        renderFuncNameVarNames.forEach((enzymeWrapperName) => {
            console.log('enzymeWrapperName:', enzymeWrapperName);
            // Get all methods calls on EnzymeWrapper
            const instancesOfEnzymeMethodCalls =
                queryRenderFunctionMethodCalls(enzymeWrapperName);
            console.log(
                'instancesOfEnzymeMethodCalls:',
                instancesOfEnzymeMethodCalls.length,
            );

            // Get the method name called on the the wrapper and add suggestions
            getMethodAndSuggest(
                instancesOfEnzymeMethodCalls,
                enzymeWrapperName,
            );
        });
    }

    // Get all enzymeWrapperName calls
    function queryRenderFunctionMethodCalls(enzymeWrapperName: string) {
        return root.find(j.CallExpression, {
            callee: {
                object: {
                    name: enzymeWrapperName,
                },
            },
        });
    }

    // Find all method instances and add suggestions
    function getMethodAndSuggest(
        collectionOfEnzymeMethodCalls: Collection,
        enzymeWrapperName: string,
    ) {
        collectionOfEnzymeMethodCalls.forEach((path) => {

            // Get enzyme method and args
            const enzymeMethod = getEnzymeMethod(path);
            const enzymeMethodArgs = getEnzymeMethodArgs(path);

            if (enzymeMethod && enzymeMethod !== 'find') {
                const suggestion = generateSuggestion(enzymeWrapperName, enzymeMethod, enzymeMethodArgs);
                addComment(path, suggestion)
            }
        });
    }

    // Generates suggestions for updated method calls
    function generateSuggestion(
        enzymeWrapperName: string,
        wrapperMethod: string,
        wrapperMethodArgs: string | null,
    ) {
        let defaultSuggestion = `// Conversion suggestion: ${enzymeWrapperName}.${wrapperMethod}(${wrapperMethodArgs || ''}) --> `;

        const suggestionByMethod = suggestByMethod(wrapperMethod, wrapperMethodArgs);

        console.log('enzymeWrapper:', enzymeWrapperName);
        console.log('wrapperMethod:', wrapperMethod); 
        console.log('wrapperMethodArgs', wrapperMethodArgs);

        // 1. add logic for find suggestions based on the selector
        // 2. create better logic for convertSelector for find
        // 3. check the logic for suggestByMethod logic for each method 

        // const { suggestionSuffix } = convertSelector(wrapperMethodArgs, testId);
        // const suggestion = `// SUGGESTION: ${renderFuncVarName}.${wrapperMethod}(${wrapperMethodArgs}) --> ${suggestionSuffix}`;
        return defaultSuggestion + suggestionByMethod
    }

    // TODO: add try catch to not error out if something doesn't work
    function getEnzymeMethod(path: ASTPath<any>) {
        const calleeProperty = path.node.callee as MemberExpression;
        const expressionArg = calleeProperty.property as Identifier;
        const wrapperMethod = expressionArg.name;
        return wrapperMethod;
    }

    // TODO: add try catch to not error out if something doesn't work
    function getEnzymeMethodArgs(path: ASTPath<any>): string | null {
        const wrapperMethodArgsNode = path.node.arguments[0];
        let wrapperMethodArgs: string | null;
        // If the function argument is a reference to another variable
        if (j.Identifier.check(wrapperMethodArgsNode)) {
            wrapperMethodArgs = wrapperMethodArgsNode.name;
            // If the function arg is a string
        } else if (j.Literal.check(wrapperMethodArgsNode)) {
            wrapperMethodArgs = wrapperMethodArgsNode.value as string;
        } else {
            wrapperMethodArgs = null;
        }
        return wrapperMethodArgs;
    }

    function suggestByMethod(wrapperMethod: string, wrapperMethodArgs: string | null) {
        let suggestion = '';

        switch (wrapperMethod) {
            case 'setState':
                suggestion += `You need to simulate a user interaction or use a hook to change the state to ${wrapperMethodArgs}.`;
                break;
            case 'prop':
                suggestion += `Consider querying the element and checking its property "${wrapperMethodArgs}" using screen.getBy... or screen.queryBy....`;
                break;
            case 'state':
                suggestion += `You need to query the DOM and assert the state changes by checking the element’s attributes or text content for ${wrapperMethodArgs}.`;
                break;
            case 'ref':
                suggestion += 'Accessing refs directly is not recommended. Try to test the result of DOM manipulations instead.';
                break;
            case 'context':
                suggestion += 'Wrap your component in a context provider and test the rendering result.';
                break;
            case 'contains':
                suggestion += `Use screen.getByText or screen.queryByText to check if the element contains "${wrapperMethodArgs}".`;
                break;
            case 'findWhere':
                suggestion += `Use screen.getBy... or screen.queryBy... with a custom matcher function to find elements conditionally matching ${wrapperMethodArgs}.`;
                break;
            case 'matchesElement':
                suggestion += `Use screen.getBy... or screen.queryBy... to find elements and then compare them with the expected output ${wrapperMethodArgs}.`;
                break;
            case 'containsMatchingElement':
                suggestion += `Use screen.queryBy... to find elements and then compare their structure with the expected output ${wrapperMethodArgs}.`;
                break;
            case 'instance':
                suggestion += 'Avoid testing implementation details. Focus on the component\'s output and behavior.';
                break;
            case 'name':
                suggestion += `Use screen.getByRole to find elements by their role "${wrapperMethodArgs}".`;
                break;
            case 'find':
                suggestion += `Use screen.getBy... or screen.queryBy... to find elements matching ${wrapperMethodArgs}.`;
                break;
            case 'debug':
                suggestion += 'Use screen.debug() to print the DOM structure.';
                break;
            case 'getElement':
                suggestion += `Use screen.getBy... or screen.queryBy... to access the element directly. Consider checking for ${wrapperMethodArgs}.`;
                break;
            case 'getElements':
                suggestion += `Use screen.getAllBy... or screen.queryAllBy... to access multiple elements directly matching ${wrapperMethodArgs}.`;
                break;
            case 'simulate':
                suggestion += `Use fireEvent or userEvent from @testing-library/react to simulate user interactions for ${wrapperMethodArgs}.`;
                break;
            case 'hasClass':
                suggestion += `Use expect(element).toHaveClass("${wrapperMethodArgs}") to check if an element has a specific class.`;
                break;
            case 'getDOMNode':
                suggestion += 'Use screen.getBy... or screen.queryBy... to get the DOM node.';
                break;
            case 'html':
                suggestion += 'Use element.innerHTML to get the HTML content.';
                break;
            case 'text':
                suggestion += 'Use screen.getByText or element.textContent to get the text content of the element.';
                break;
            case 'type':
                suggestion += `Use screen.getByRole to find elements by their role or type "${wrapperMethodArgs}".`;
                break;
            case 'update':
                suggestion += 'Re-render the component using render() from @testing-library/react to reflect the updated state.';
                break;
            case 'wrapper':
                suggestion += 'Focus on querying and interacting with the rendered output rather than the wrapper itself.';
                break;
            default:
                suggestion += 'This Enzyme method does not have a direct equivalent in RTL. Consider rewriting this part of the test to focus on user interactions and DOM assertions.';
                break;
        }
    
        return suggestion;
    }
};
