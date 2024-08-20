import fs from 'fs';
import { genPrompt } from './generate-prompt';
import { countTestCases } from './utils/utils';

describe('genPrompt', () => {
    const enzymeFilePath =
        'src/support/prompt-generation/utils/test-data/gen-prompt-test-file.jest.tsx';
    const mockGetByTestIdAttribute = 'data-testid';
    const mockAstCodemodOutput = '<codemod>Partially converted code</codemod>';
    const mockRenderedCompCode = '<component>Rendered component</component>';

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
      If the output adheres to all conditions and uses instructions section, you can simply state "The output meets all specified conditions.
      Enzyme test case code: <enzyme_test_code>describe('Test suite', () => {
    it('test case 1', () => {});
    it.each([1, 2, 3])('test case 2', (num) => {});
    test('test case 3', () => {});
    test.each([4, 5, 6])('test case 4', (num) => {});
});
      </enzyme_test_code>
      Partially converted test file code: <codemod><codemod>Partially converted code</codemod></codemod>
      Rendered component DOM tree: <component><component>Rendered component</component></component>
    `
            .replace(/\s+/g, ' ')
            .trim();

        const result = genPrompt(
            enzymeFilePath,
            mockGetByTestIdAttribute,
            mockAstCodemodOutput,
            mockRenderedCompCode,
        );

        expect(result.replace(/\s+/g, ' ').trim()).toBe(expectedPrompt);
    });

    it('should count test cases correctly', () => {
        const result = countTestCases(enzymeFilePath);
        expect(result).toBe(4);
    });

    it('should return 0 if no test cases are found in the test file code', () => {
        // Use jest.spyOn to mock fs.readFileSync for this test
        const readFileSyncMock = jest.spyOn(fs, 'readFileSync');

        // Define the mock file content
        const fileContent = `
            describe('Test suite that has no test cases', () => {
                // No test
            });
        `;

        // Mock fs.readFileSync to return the specified file content
        readFileSyncMock.mockReturnValue(fileContent);

        // Call the function under test
        const result = countTestCases('enzymeFilePathNoTests');

        // Assert that the result is as expected
        expect(result).toBe(0);
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
        const result = genPrompt(
            enzymeFilePath,
            mockGetByTestIdAttribute,
            mockAstCodemodOutput,
            mockRenderedCompCode,
            extendPrompt,
        );

        expect(result).toContain(
            '1. Wrap component rendering into <Provider store={createTestStore()}><Component></Provider>.',
        );
        expect(result).toContain(
            "2. dataTest('selector') should be converted to screen.getByTestId('selector')",
        );
    });
});
