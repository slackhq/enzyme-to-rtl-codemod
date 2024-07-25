import { convertText } from '../src/utils/ast-transformations/individual-transformations/convert-enzyme-text-method';
import jscodeshift from 'jscodeshift';

describe('convertText', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('Should convert text assertion calls to toHaveTextContent', () => {
        const source = `
            expect(wrapper.find('selector').text()).toEqual('Expected text');
        `;

        // Transform the source code
        const root = j(source);
        convertText(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
            expect(wrapper.find('selector')).toHaveTextContent('Expected text');
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
