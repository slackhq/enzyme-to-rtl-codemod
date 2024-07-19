import { convertFind } from '../src/utils/ast-transformations/individual-transformations/convert-find';
import { addComment } from '../src/utils/ast-transformations/utils/add-comment';
import * as jscodeshift from 'jscodeshift';

// Mock the addComment function
jest.mock('../src/utils/ast-transformations/utils/add-comment.ts', () => ({
    addComment: jest.fn(),
}));

describe('convertFind', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('should add a comment suggesting conversion for .find method calls', () => {
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.find('div');
        `;

        const root = j(source);
        convertFind(j, root);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            '/* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/'
        );
    });

    // Add more tests here
});