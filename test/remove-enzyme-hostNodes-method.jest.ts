import { removeHostnodes } from '../src/utils/ast-transformations/individual-transformations/remove-enzyme-hostNodes-method';
import jscodeshift from 'jscodeshift';

describe('removeHostNodes', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('Should remove .hostNodes() method calls', () => {
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.find('div').hostNodes().toHaveLength(1);
        `;

        // Transform the source code
        const root = j(source);
        removeHostnodes(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
            const wrapper = shallow(<Component />);
            wrapper.find('div').toHaveLength(1);
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
