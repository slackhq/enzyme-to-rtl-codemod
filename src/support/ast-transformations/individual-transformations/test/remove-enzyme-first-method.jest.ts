import { removeFirst } from '../remove-enzyme-first-method';
import jscodeshift from 'jscodeshift';

describe('removeFirst', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('Should remove .first() method calls', () => {
        const source = `
            const wrapper = shallow(<Component />);
            wrapper.find('div').first().text().toEqual('Hello');
        `;

        // Transform the source code
        const root = j(source);
        removeFirst(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
            const wrapper = shallow(<Component />);
            wrapper.find('div').text().toEqual('Hello');
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
