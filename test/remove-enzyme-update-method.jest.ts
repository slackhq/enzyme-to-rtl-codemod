import { convertUpdate } from '../src/utils/ast-transformations/individual-transformations/remove-enzyme-update-method';
import jscodeshift from 'jscodeshift';

describe('convertUpdate', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('Should remove chained .update() method calls', () => {
        // Example source code before transformation
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.find('[role="listbox"]').simulate('click').update();
        `;

        // Transform the source code
        const root = j(source);
        convertUpdate(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        // Define the expected source code after transformation
        const expectedSource = `
            const wrapper = shallow(<Component />);
            wrapper.find('[role="listbox"]').simulate('click');
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });

    it('Should remove wrapper.update() when method is the entire expression', () => {
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.update();
        `;

        // Transform the source code
        const root = j(source);
        convertUpdate(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        // Define the expected source code after transformation
        const expectedSource = `
            const wrapper = shallow(<Component />);
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});