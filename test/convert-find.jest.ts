import { convertFind } from '../src/utils/ast-transformations/individual-transformations/convert-find';
import { addComment } from '../src/utils/ast-transformations/utils/add-comment';
import jscodeshift from 'jscodeshift';

// Mock the addComment function
jest.mock('../src/utils/ast-transformations/utils/add-comment.ts', () => ({
    addComment: jest.fn(),
}));

describe('convertFind', () => {
    let j: jscodeshift.JSCodeshift;
    const testId = 'data-id';

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('should add a comment suggesting conversion for .find method calls', () => {
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.find('div');
        `;

        const root = j(source);
        convertFind(j, root, testId);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            '/* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/',
        );
    });

    it('Should convert test-id attribute to correct ByTestId query based on expect expression', () => {
        const source = `
        expect(wrapper.find('[data-id="element"]')).toBeInTheDocument();
        expect(wrapper.find({'data-id':'element'})).not.toBeInTheDocument();
        `;

        // Transform the source code
        const root = j(source);
        convertFind(j, root, testId);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
        expect(screen.getByTestId("element")).toBeInTheDocument();
        expect(screen.queryByTestId("element")).not.toBeInTheDocument();
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });

    it('Should convert all .find Data QA object expressions', () => {
        const source = `
        expect(wrapper.find({'data-id':'element'})).toBeInTheDocument();
        `;

        // Transform the source code
        const root = j(source);
        convertFind(j, root, testId);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
        expect(screen.getByTestId("element")).toBeInTheDocument();
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });

    it(`Should add convert 'role' expression to getByRole() query`, () => {
        const source = `
        expect(wrapper.find('[role="img"]')).toBeInTheDocument();
        `;

        // Transform the source code
        const root = j(source);
        convertFind(j, root, '');

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
        expect(screen.getByRole("img")).toBeInTheDocument();
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
