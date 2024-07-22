import { convertSimulate } from '../src/utils/ast-transformations/individual-transformations/convert-simulate';
import jscodeshift from 'jscodeshift';

describe('convertSimulate', () => {
    let j: jscodeshift.JSCodeshift;

    beforeEach(() => {
        j = jscodeshift.withParser('tsx');
    });

    it.each`
        simulateEvent   | userEventMethod
        ${'click'}      | ${'click'}
        ${'mouseenter'} | ${'hover'}
        ${'mouseEnter'} | ${'hover'}
        ${'mouseleave'} | ${'unhover'}
        ${'mouseLeave'} | ${'unhover'}
    `(
        'Should convert .simulate($simulateEvent) with userEvent.$userEventMethod() method and import user-event library',
        ({ simulateEvent, userEventMethod }) => {
            const source = `
            const component = render(<Component />);
            component.getByText('Button').simulate('${simulateEvent}');
            expect(component.getByText('Updated').toBeInTheDocument());
        `;

            // Transform the source code
            const root = j(source);
            convertSimulate(j, root);

            // Generate the transformed source code
            const transformedSource = root.toSource();

            const expectedSource = `
            import userEvent from "@testing-library/user-event";
            const component = render(<Component />);
            userEvent.${userEventMethod}(component.getByText('Button'));
            expect(component.getByText('Updated').toBeInTheDocument());
        `;

            // Check if the transformed source matches the expected source
            expect(transformedSource).toBe(expectedSource);
        },
    );
    it('Should provide a suggestion if simulate event does not exist', () => {
        const fakeSimulateEvent = 'holding';
        const source = `
        const component = render(<Component />);
        component.getByText('Button').simulate('${fakeSimulateEvent}');
        expect(component.getByText('Updated').toBeInTheDocument());
    `;

        // Transform the source code
        const root = j(source);
        convertSimulate(j, root);

        // Generate the transformed source code
        const transformedSource = root.toSource();

        const expectedSource = `
        import userEvent from "@testing-library/user-event";

        /* SUGGESTION: .simulate('<method>') --> userEvent.<method>(<DOM_element>);
         See: https://testing-library.com/docs/user-event/intro/ */

        const component = render(<Component />);
        component.getByText('Button').simulate('holding');
        expect(component.getByText('Updated').toBeInTheDocument());
    `;

        // Check if the transformed source matches the expected source
        expect(transformedSource).toBe(expectedSource);
    });
});
