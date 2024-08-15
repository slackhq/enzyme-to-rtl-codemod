import jscodeshift from 'jscodeshift';
import { convertMountShallowVars } from '../convert-mount-shallow-vars';

describe('convertMountShallowVars', () => {
    const j = jscodeshift.withParser('tsx');

    const transformAndExpect = (
        source: string,
        expectedText: string,
        renderFunction: string,
        expectedVars: string[],
    ): void => {
        const root = j(source);
        const varNames = convertMountShallowVars(j, root, renderFunction);
        expect(root.toSource().replace(/\s+/g, '')).toBe(
            expectedText.replace(/\s+/g, ''),
        );
        expect(varNames).toEqual(expectedVars);
    };

    it('should convert variable declaration with abstracted function', () => {
        const source = `
			const wrapper = abstractedFunction({ value: 111 });
		`;
        const expectedText = `
			abstractedFunction({ value: 111 });
		`;
        transformAndExpect(source, expectedText, 'abstractedFunction', [
            'wrapper',
        ]);
    });

    it('should convert assignment expression with abstracted function and remove variable declaration', () => {
        const source = `
			let mountedComponent: ReactWrapper;
			mountedComponent = abstractedFunction({ value: 111 });
		`;
        const expectedText = `
			abstractedFunction({ value: 111 });
		`;
        transformAndExpect(source, expectedText, 'abstractedFunction', [
            'mountedComponent',
        ]);
    });

    it('should handle direct variable declaration with shallow function call and variable name as abstracted function', () => {
        const source = `
			const shallowComponent = shallow(<Component />);
		`;
        const expectedText = `
			shallow(<Component />);
		`;
        transformAndExpect(source, expectedText, 'shallowComponent', [
            'shallowComponent',
        ]);
    });

    it('should return unique variable names when multiple wrappers call the same function name', () => {
        const source = `
			const wrapper = abstractedFunction({ value: 111 });

			let mountedComponent: ReactWrapper;
			mountedComponent = abstractedFunction({ value: 222 });
		`;
        const expectedText = `
		abstractedFunction({ value: 111 });
		abstractedFunction({ value: 222 });
	`;
        transformAndExpect(source, expectedText, 'abstractedFunction', [
            'wrapper',
            'mountedComponent',
        ]);
    });
});
