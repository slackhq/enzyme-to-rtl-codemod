import { addSuggestions } from '../add-suggestions';
import { addComment } from '../../utils/add-comment';
import jscodeshift from 'jscodeshift';

// Mock the addComment function
jest.mock('../../utils/add-comment', () => ({
    addComment: jest.fn(),
}));

describe('addSuggestions', () => {
    const renderFuncNameVarNames = ['wrapper'];
    const j = jscodeshift.withParser('tsx');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not add a comment suggesting conversion for .find method calls', () => {
        const source = `
            wrapper.find('div');
        `;

        const root = j(source);
        addSuggestions(j, root, renderFuncNameVarNames);
        expect(addComment).not.toHaveBeenCalled();
    });

    it('should add a comment suggesting conversion for .setState method calls', () => {
        const source = `
            wrapper.setState('someState');
        `;

        const root = j(source);
        addSuggestions(j, root, renderFuncNameVarNames);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: wrapper.setState('someState') --> You need to simulate a user interaction or use a hook to change the state to 'someState'.",
        );
    });

    it('should add a comment suggesting conversion for .prop method calls', () => {
        const source = `
            wrapper.prop('someProp');
        `;

        const root = j(source);
        addSuggestions(j, root, renderFuncNameVarNames);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: wrapper.prop('someProp') --> Consider querying the element and checking its property 'someProp' using screen.getBy... or screen.queryBy....",
        );
    });

    it('should add a comment suggesting conversion for .state method calls', () => {
        const source = `
            wrapper.state('someState');
        `;

        const root = j(source);
        addSuggestions(j, root, renderFuncNameVarNames);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: wrapper.state('someState') --> You need to query the DOM and assert the state changes by checking the element's attributes or text content for 'someState'.",
        );
    });

    it('should add a comment suggesting conversion for .contains method calls', () => {
        const source = `
            wrapper.contains('someText');
        `;

        const root = j(source);
        addSuggestions(j, root, renderFuncNameVarNames);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: wrapper.contains('someText') --> Use screen.getByText or screen.queryByText to check if the element contains 'someText'.",
        );
    });

    it('should add a generic comment for unsupported methods', () => {
        const source = `
            wrapper.someUnsupportedMethod('someArg');
        `;

        const root = j(source);
        addSuggestions(j, root, renderFuncNameVarNames);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: wrapper.someUnsupportedMethod('someArg') --> Consider rewriting this part of the test to focus on user interactions and DOM assertions.",
        );
    });
});
