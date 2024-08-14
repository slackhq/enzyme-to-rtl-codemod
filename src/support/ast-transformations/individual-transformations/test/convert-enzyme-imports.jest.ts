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
        convertImports(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
            import { render, screen } from "@testing-library/react";
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
