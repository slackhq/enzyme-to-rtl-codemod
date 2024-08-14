import fs from 'fs';
import {
    generateInitialPrompt,
    generateFeedbackPrompt,
} from './generate-prompt';

describe('generate initial prompt', () => {
    const enzymeFilePath =
        'src/support/prompt-generation/utils/test-data/gen-prompt-test-file.jest.tsx';
    const mockGetByTestIdAttribute = 'data-testid';
    const mockAstCodemodOutput = '<codemod>Partially converted code</codemod>';
    const mockRenderedCompCode = '<component>Rendered component</component>';
    const originalTestCaseNum = 4;

    it('should generate the correct prompt', () => {
        const expectedPrompt = `
      I need assistance converting an Enzyme test case to the React Testing Library framework.
      I will provide you with the Enzyme test file code inside <enzyme_test_code></enzyme_test_code> tags.
      I will also give you the partially converted test file code inside <codemod></codemod> tags.
      The rendered component DOM tree for each test case will be provided in <component></component> tags with this structure for one or more test cases "<test_case_title></test_case_title> and <dom_tree></dom_tree>"
      Please perform the following tasks:
      1. Complete the conversion for the test file within <codemod></codemod> tags.
      2. Convert all test cases and ensure the same number of tests in the file. In the original file there are 4 test cases.
      3. Replace Enzyme methods with the equivalent React Testing Library methods.
      4. Update Enzyme imports to React Testing Library imports.
      5. Adjust Jest matchers for React Testing Library.
      6. Return the entire file with all converted test cases, enclosed in <rtl_test_code></rtl_test_code> tags.
      7. Do not modify anything else, including imports for React components and helpers.
      8. Preserve all abstracted functions as they are and use them in the converted file.
      9. Maintain the original organization and naming of describe and it blocks.
      Ensure that all conditions are met. The converted file should be runnable by Jest without any manual changes.
      Other instructions section, use them when applicable:
      1. Prioritize queries in the following order getByRole, getByPlaceholderText, getByText, getByDisplayValue, getByAltText, getByTitle, then getByTestId.
      2. data-testid attribute is configured to be used with "screen.getByTestId" queries.
      3. For user simulations use userEvent and import it with "import userEvent from '@testing-library/user-event';"
      4. Use query* variants only for non-existence checks: Example "expect(screen.query*('example')).not.toBeInTheDocument();"
      5. Ensure all text/strings are converted to lowercase regex expression. Example: screen.getByText(/your text here/i), screen.getByRole('button', {name: /your text here/i}).
      6. When asserting that a DOM renders nothing, replace isEmptyRender()).toBe(true) with toBeEmptyDOMElement() by wrapping the component into a container. Example: expect(container).toBeEmptyDOMElement();.
      Now, please evaluate your output and make sure your converted code is between <rtl_test_code></rtl_test_code> tags.
      If there are any deviations from the specified conditions, list them explicitly.
      If the output adheres to all conditions and uses instructions section, you can simply state "The output meets all specified conditions."
      Enzyme test case code: <enzyme_test_code>describe('Test suite', () => {
    it('test case 1', () => {});
    it.each([1, 2, 3])('test case 2', (num) => {});
    test('test case 3', () => {});
    test.each([4, 5, 6])('test case 4', (num) => {});
});
      </enzyme_test_code>
      Partially converted test file code: <codemod><codemod>Partially converted code</codemod></codemod>
      Rendered component DOM tree: <component><component>Rendered component</component></component>`
            .replace(/\s+/g, ' ')
            .trim();

        const result = generateInitialPrompt({
            filePath: enzymeFilePath,
            getByTestIdAttribute: mockGetByTestIdAttribute,
            astCodemodOutput: mockAstCodemodOutput,
            renderedCompCode: mockRenderedCompCode,
            originalTestCaseNum,
        });

        expect(result.replace(/\s+/g, ' ').trim()).toBe(expectedPrompt);
    });

    it('should generate prompt with additions and enumerate them', () => {
        const extendPrompt = [
            `Wrap component rendering into <Provider store={createTestStore()}><Component></Provider>.
        In order to do that you need to do two things
        First, import these:
        import { Provider } from '.../provider';
        import createTestStore from '.../test-store';
        Second, wrap component rendering in <Provider>, if it was not done before.
        Example: <Provider store={createTestStore()}> <Component {...props} /> </Provider>`,
            "dataTest('selector') should be converted to screen.getByTestId('selector')",
        ];

        const result = generateInitialPrompt({
            filePath: enzymeFilePath,
            getByTestIdAttribute: mockGetByTestIdAttribute,
            astCodemodOutput: mockAstCodemodOutput,
            renderedCompCode: mockRenderedCompCode,
            originalTestCaseNum: 4,
            extendPrompt,
        });
        expect(result).toContain(
            '1. Wrap component rendering into <Provider store={createTestStore()}><Component></Provider>.',
        );
        expect(result).toContain(
            "2. dataTest('selector') should be converted to screen.getByTestId('selector')",
        );
    });
});

describe('generateFeedbackPrompt', () => {
    beforeEach(() => {
        // Mock the fs.readFileSync function
        jest.spyOn(fs, 'readFileSync').mockImplementation(
            (filePath: fs.PathOrFileDescriptor) => {
                if (typeof filePath === 'string') {
                    if (filePath === '/path/to/rtlConvertedFile.js') {
                        return 'Mocked RTL test file content';
                    }
                    if (filePath === '/path/to/jestRunLogs.log') {
                        return 'Mocked Jest logs content';
                    }
                }
                return '';
            },
        );
    });

    afterEach(() => {
        // Restore the original implementation of fs.readFileSync after each test
        jest.restoreAllMocks();
    });

    it('should generate the correct feedback prompt for a happy path', () => {
        // Arrange
        const params = {
            rtlConvertedFilePathAttmpt1: '/path/to/rtlConvertedFile.js',
            getByTestIdAttribute: 'data-testid',
            jestRunLogsFilePathAttmp1: '/path/to/jestRunLogs.log',
            renderedCompCode: '<div>Mocked Component</div>',
            originalTestCaseNum: 5,
            extendPrompt: [
                'Please improve coverage.',
                'Ensure performance optimizations.',
            ],
        };

        // Act
        const result = generateFeedbackPrompt(params);

        // Assert
        expect(result).toContain(
            'I need assistance fixing a React unit test that uses React Testing Library',
        );
        expect(result).toContain(
            `In the original file there are ${params.originalTestCaseNum} test cases.`,
        );
        expect(result).toContain(
            '\nReact Testing Library test file code: <code>Mocked RTL test file content</code>',
        );
        expect(result).toContain(
            `2. ${params.getByTestIdAttribute} attribute is configured to be used with "screen.getByTestId" queries.`,
        );
        expect(result).toContain(
            '\nJest test run logs: <jest_run_logs>Mocked Jest logs content</jest_run_logs>',
        );
        expect(result).toContain(
            `\nRendered component DOM tree: <component>${params.renderedCompCode}</component>`,
        );
        expect(result).toContain('1. Please improve coverage.');
        expect(result).toContain('2. Ensure performance optimizations.');
    });
});
