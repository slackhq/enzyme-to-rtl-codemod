import { convertExists } from '../src/utils/ast-transformations/individual-transformations/convert-exists';
import jscodeshift from 'jscodeshift';

describe('convertExists', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it.each`
        enzymeExistCall               | jestDOMMatcher
        ${'exists()).toBe(true)'}     | ${'toBeInTheDocument()'}
        ${'exists()).toBe(false)'}    | ${'not.toBeInTheDocument()'}
        ${'exists()).toBeTruthy()'}   | ${'toBeInTheDocument()'}
        ${'exists()).toBeFalsy()'}    | ${'not.toBeInTheDocument()'}
        ${'exists()).toEqual(true)'}  | ${'toBeInTheDocument()'}
        ${'exists()).toEqual(false)'} | ${'not.toBeInTheDocument()'}
    `(
        'Should convert exist() method calls to toBeInTheDocument()',
        ({ enzymeExistCall, jestDOMMatcher }) => {
            const enzymeSource = `expect(wrapper.${enzymeExistCall};`;

            // Transform the source code
            const root = j(enzymeSource);
            convertExists(j, root);

            // Generate the transformed source code
            const transformedSource = root.toSource();

            const expectedSource = `expect(wrapper).${jestDOMMatcher};`;

            // Check if the transformed source matches the expected source
            expect(transformedSource).toBe(expectedSource);
        },
    );
});
