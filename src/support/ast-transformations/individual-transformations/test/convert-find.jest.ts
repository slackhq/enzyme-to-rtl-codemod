import { convertFind } from '../convert-find';
import { addComment } from '../../utils/add-comment';
import jscodeshift from 'jscodeshift';

// Mock the addComment function
jest.mock('../../utils/add-comment', () => ({
    addComment: jest.fn(),
}));

describe('convertFind', () => {
    const j = jscodeshift.withParser('tsx');
    const testId = 'data-id';

    beforeEach(() => {
        jest.clearAllMocks();
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

    it('Should convert all .find test id object expressions', () => {
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

    it("Should convert 'role' expression to getByRole() query", () => {
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

    it('Should add comment with suggestion to render the component', () => {
        const source = `
            expect(wrapper.find(Component)).toBeInTheDocument();
        `;

        // Transform the source code
        const root = j(source);
        convertFind(j, root, testId);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: .find(Component) --> Use component rendered DOM to get the appropriate selector and method: screen.getByRole('selector') or screen.getByTestId('<data-id=...>')",
        );
    });

    it('should add a comment suggesting conversion for .find method calls if it has testID in it', () => {
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.find('selector that has ${testId} in it');
        `;

        const root = j(source);
        convertFind(j, root, testId);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: .find('selector that has data-id in it') --> screen.getByTestId('selector that has data-id in it')",
        );
    });

    it('should add a comment suggesting conversion for .find method calls with getByRole(button)', () => {
        const source = `
            wrapper.find('button');
        `;

        const root = j(source);
        convertFind(j, root, testId);

        expect(addComment).toHaveBeenCalledTimes(1);
        expect(addComment).toHaveBeenCalledWith(
            expect.anything(),
            "// Conversion suggestion: .find('button') --> screen.getByRole(button)",
        );
    });
});
