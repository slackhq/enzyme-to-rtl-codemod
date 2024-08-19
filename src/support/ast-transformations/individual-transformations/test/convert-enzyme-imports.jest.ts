import { convertEnzymeImports } from '../convert-enzyme-imports';
import jscodeshift from 'jscodeshift';

describe('convertText', () => {
    let j: jscodeshift.JSCodeshift;
    const testId = 'data-id';

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it('Should convert Enzyme imports to RTL imports', () => {
        const source = `
            import { mount } from 'enzyme';
            import { addComment } from '../../utils/add-comment';
        `;

        // Transform the source code
        const root = j(source);
        convertEnzymeImports(j, root, testId);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
            import "@testing-library/jest-dom";
            import { configure } from "@testing-library/dom";

            configure({
                        testIdAttribute: "data-id"
            });

            import { render, screen } from "@testing-library/react";
            import { addComment } from '../../utils/add-comment';
        `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
