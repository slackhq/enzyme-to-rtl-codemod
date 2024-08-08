import type { ASTPath } from 'jscodeshift';
import { astLogger } from './ast-logger';

/**
 * Returns the correct query method, getBy or queryBy, depending on the expect expression
 * @param path
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getQueryMethod = (path: ASTPath<any>): string => {
    return path.parentPath?.parentPath?.value?.callee?.name === 'expect' &&
        path.parentPath?.parentPath?.parentPath?.value?.property?.name === 'not'
        ? 'queryBy'
        : 'getBy';
};

/**
 * Extracts the testId value from the selector
 * @param path
 * @returns - testId value
 */
export const extractTestIdValue = (input: string, testid: string): string => {
    const regex = new RegExp(`${testid}="([^"]+)"`);
    const match = input.match(regex);
    return match ? match[1] : input;
};

/**
 * Interface defining the structure for the transformed selector
 */
interface ScreenMethodInterface {
    screenMethod: string;
    screenMethodArg: string | null;
    suggestionSuffix: string;
}

/**
 * Create suggestion based on selector
 * @param selector
 * @param testid
 * @returns
 */
export const suggestBySelector = (selector: string, testid: string): string => {
    const suggestionPrefix = `// Conversion suggestion: .find(${selector}) --> `;
    let suggestionBySelector =
        "Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')";

    // Check if the argument has test id in it
    if (selector.includes(testid)) {
        astLogger.verbose('Query selectors including data-id attributes');

        // Set screen method
        const screenMethod = 'screen.getByTestId';

        // Get test-id value
        const screenMethodArg = extractTestIdValue(selector, testid);

        suggestionBySelector = `${screenMethod}(${screenMethodArg})`;
    } else {
        // Map of selectors to their respective ARIA roles
        const selectorRoleMap: { [key: string]: string } = {
            article: 'article',
            button: 'button',
            checkbox: 'checkbox',
            combobox: 'combobox',
            dialog: 'dialog',
            form: 'form',
            heading: 'heading',
            img: 'img',
            link: 'link',
            listitem: 'listitem',
            menuitem: 'menuitem',
            menuitemcheckbox: 'menuitemcheckbox',
            menuitemradio: 'menuitemradio',
            navigation: 'navigation',
            option: 'option',
            progressbar: 'progressbar',
            radio: 'radio',
            row: 'row',
            rowheader: 'rowheader',
            search: 'search',
            separator: 'separator',
            slider: 'slider',
            spinbutton: 'spinbutton',
            switch: 'switch',
            tabpanel: 'tabpanel',
            textbox: 'textbox',
        };

        // Iterate over the map to find the matching selector
        for (const key in selectorRoleMap) {
            if (selector.includes(key)) {
                const screenMethod = 'screen.getByRole';
                const screenMethodArg = selectorRoleMap[key];
                suggestionBySelector = `${screenMethod}(${screenMethodArg})`;
                break;
            }
        }
    }

    return suggestionPrefix + suggestionBySelector;
};

/**
 * Generates suggestions for enzyme method conversion
 * @param enzymeWrapperName
 * @param wrapperMethod
 * @param wrapperMethodArgs
 * @returns
 */
export const generateSuggestion = (
    enzymeWrapperName: string,
    wrapperMethod: string,
    wrapperMethodArgs: string | null,
): string => {
    const defaultSuggestion = `// Conversion suggestion: ${enzymeWrapperName}.${wrapperMethod}(${wrapperMethodArgs || ''}) --> `;
    const suggestionByMethod = suggestByMethod(
        wrapperMethod,
        wrapperMethodArgs,
    );
    return defaultSuggestion + suggestionByMethod;
};

/**
 * Provide suggestion based on enzyme method and args
 * @param wrapperMethod
 * @param wrapperMethodArgs
 * @returns
 */
const suggestByMethod = (
    wrapperMethod: string,
    wrapperMethodArgs: string | null,
): string => {
    let suggestion = '';

    switch (wrapperMethod) {
        case 'setState':
            suggestion += `You need to simulate a user interaction or use a hook to change the state to ${wrapperMethodArgs}.`;
            break;
        case 'prop':
            suggestion += `Consider querying the element and checking its property ${wrapperMethodArgs} using screen.getBy... or screen.queryBy....`;
            break;
        case 'state':
            suggestion += `You need to query the DOM and assert the state changes by checking the element's attributes or text content for ${wrapperMethodArgs}.`;
            break;
        case 'contains':
            suggestion += `Use screen.getByText or screen.queryByText to check if the element contains ${wrapperMethodArgs}.`;
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
            suggestion +=
                "Avoid·testing·implementation·details.·Focus·on·the·component's·output·and·behavior.";
            break;
        case 'name':
            suggestion += `Use screen.getByRole to find elements by their role ${wrapperMethodArgs}.`;
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
        case 'hasClass':
            suggestion += `Use expect(element).toHaveClass(${wrapperMethodArgs}) to check if an element has a specific class.`;
            break;
        case 'getDOMNode':
            suggestion +=
                'Use screen.getBy... or screen.queryBy... to get the DOM node.';
            break;
        case 'text':
            suggestion +=
                'Use screen.getByText to get the text content of the element.';
            break;
        case 'wrapper':
            suggestion +=
                'Focus on querying and interacting with the rendered output rather than the wrapper itself.';
            break;
        default:
            suggestion +=
                'Consider rewriting this part of the test to focus on user interactions and DOM assertions.';
            break;
    }
    return suggestion;
};
