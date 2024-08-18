import { convertImports } from '../convert-enzyme-imports';
import jscodeshift from 'jscodeshift';

describe('convertText', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('Should convert Enzyme imports to RTL imports', () => {
        const source = `
            import { mount } from 'enzyme';
        `;

        // Transform the source code
        const root = j(source);
        convertImports(j, root, 'path/to/file');

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
            import { render, screen } from "@testing-library/react";
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });

    it('Should convert relative to absolute imports', () => {
        const source = `
            import { mount } from 'enzyme';
            import { addComment } from '../../utils/add-comment';
            import { countTestCases } from '../../../prompt-generation/utils/utils';
        `;

        // Transform the source code
        const root = j(source);
        convertImports(
            j,
            root,
            'src/support/ast-transformations/individual-transformations/test/convert-enzyme-imports.jest.ts',
        );

        // Generate the transformed source code
        const transformedSource = root.toSource();

        // Verify enzyme import conversion
        expect(transformedSource).toContain(
            'import { render, screen } from "@testing-library/react";',
        );

        // Verify a part of the abosolute path is present for both imports
        expect(transformedSource).toContain(
            'src/enzyme-to-rtl-codemod/src/support/ast-transformations/utils/add-comment',
        );
        expect(transformedSource).toContain(
            'src/enzyme-to-rtl-codemod/src/support/prompt-generation/utils/utils',
        );
    });
});
