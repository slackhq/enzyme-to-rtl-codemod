import type { ASTPath } from 'jscodeshift';
import { astLogger } from '../utils/ast-logger';

/**
 * Returns the correct query method, getBy or queryBy, depending on the expect expression
 * @param path
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
export const extractDataQaValue = (input: string, testid: string): string => {
    const regex = new RegExp(`${testid}="([^"]+)"`);
    const match = input.match(regex);

    return match ? match[1] : '';
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
 * Converts the input selector into a structured object used in convertFind() method
 * @param {string | null} selector - An optional string that represents a specific parameter
 * or identifier associated with the current screen.
 * @returns {ScreenMethodInterface} An object containing the default screen name, the provided selector as an argument (if applicable),
 */
export const convertSelector = (
    selector: string | null,
    testid: string,
): ScreenMethodInterface => {
    // Screen method and arg selection logic
    let screenMethod = 'getByRole';
    let screenMethodArg = selector;

    // Suggestion string logic
    let suggestionSuffix = `screen.${screenMethod}('${screenMethodArg}')`;
    const regexDataQA = /\[.*-.*=".*\]/i;
    const regexComponentName = /^[A-Z][A-Za-z]*$/;
    const regexClassName = /^\.\w+$/;

    // Returns the defaults if no selector is provided
    if (!selector) {
        astLogger.verbose('No selector is provided');
        return { screenMethod, screenMethodArg, suggestionSuffix };
    }

    // Select screen method and argument
    if (selector.includes(testid)) {
        astLogger.verbose('Query selectors including data-id attributes');
        // Set screen method
        screenMethod = 'getByTestId';

        // Get test-id value
        screenMethodArg = extractDataQaValue(selector, testid);
    } else {
        // Default to getByRole
        astLogger.verbose('Query for role attributes');
        screenMethod = 'getByRole';
        // Select the role based on the present tags
        if (selector.includes('article')) {
            screenMethodArg = 'article';
        } else if (selector.includes('button')) {
            screenMethodArg = 'button';
        } else if (selector.includes('checkbox')) {
            screenMethodArg = 'checkbox';
        } else if (selector.includes('combobox')) {
            screenMethodArg = 'combobox';
        } else if (selector.includes('dialog')) {
            screenMethodArg = 'dialog';
        } else if (selector.includes('form')) {
            screenMethodArg = 'form';
        } else if (selector.includes('heading')) {
            screenMethodArg = 'heading';
        } else if (selector.includes('img')) {
            screenMethodArg = 'img';
        } else if (selector.includes('link')) {
            screenMethodArg = 'link';
        } else if (selector.includes('listitem')) {
            screenMethodArg = 'listitem';
        } else if (selector.includes('menuitem')) {
            screenMethodArg = 'menuitem';
        } else if (selector.includes('menuitemcheckbox')) {
            screenMethodArg = 'menuitemcheckbox';
        } else if (selector.includes('menuitemradio')) {
            screenMethodArg = 'menuitemradio';
        } else if (selector.includes('navigation')) {
            screenMethodArg = 'navigation';
        } else if (selector.includes('option')) {
            screenMethodArg = 'option';
        } else if (selector.includes('progressbar')) {
            screenMethodArg = 'progressbar';
        } else if (selector.includes('radio')) {
            screenMethodArg = 'radio';
        } else if (selector.includes('row')) {
            screenMethodArg = 'row';
        } else if (selector.includes('rowheader')) {
            screenMethodArg = 'rowheader';
        } else if (selector.includes('search')) {
            screenMethodArg = 'search';
        } else if (selector.includes('separator')) {
            screenMethodArg = 'separator';
        } else if (selector.includes('slider')) {
            screenMethodArg = 'slider';
        } else if (selector.includes('spinbutton')) {
            screenMethodArg = 'spinbutton';
        } else if (selector.includes('switch')) {
            screenMethodArg = 'switch';
        } else if (selector.includes('tabpanel')) {
            screenMethodArg = 'tabpanel';
        } else if (selector.includes('textbox')) {
            screenMethodArg = 'textbox';
        } else {
            // Default argument
            screenMethodArg = selector;
        }
    }

    // Sets the suggestion suffix string based on the function arguments, otherwise return the default suggestion
    if (selector.match(regexDataQA)) {
        astLogger.verbose('Providing suggestion suffix string');
        suggestionSuffix = `screen.${screenMethod}('${extractDataQaValue(selector, testid)}')`;
    } else if (selector.match(regexClassName)) {
        astLogger.verbose('Providing default suggestion');
        suggestionSuffix =
            "Render the react component and then use an appropriate method: screen.getByRole('<role>'} or screen.getByTestId('<data-id=...>'}";
    } else if (selector.match(regexComponentName)) {
        astLogger.verbose('Providing default suggestion');
        suggestionSuffix =
            "Render the react component and then use an appropriate method: screen.getByRole('<role>'} or screen.getByTestId('<data-id=...>'}";
    }

    astLogger.verbose('Transformation complete');
    return { screenMethod, screenMethodArg, suggestionSuffix };
};
