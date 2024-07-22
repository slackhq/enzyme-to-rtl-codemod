import jscodeshift from 'jscodeshift';
import { convertMountShallowMethods } from '../src/utils/ast-transformations/individual-transformations/convert-mount-shallow-methods';
import { astLogger } from '../src/utils/ast-transformations/utils/ast-logger';

jest.mock('../src/utils/ast-transformations/utils/ast-logger');

describe('convertMountShallowCalls', () => {
	const j = jscodeshift;
	
	const transformAndExpect = (source: string, expectedText: string, abstractionName: string) => {
		const root = j(source);
		const varName = convertMountShallowMethods(j, root);
		expect(root.toSource().replace(/\s+/g, '')).toBe(expectedText.replace(/\s+/g, ''));
		expect(varName).toBe(abstractionName);
	};

	it('should convert shallow to render', () => {
		const source = `
			const wrapper = shallow(<Component/>);
		`;
		const expectedText = `
			const wrapper = render(<Component/>);
		`;
		transformAndExpect(source, expectedText, 'wrapper');
	});

	it('should convert mount to render', () => {
		const source = `
			const wrapper = mount(<Component />);
		`;
		const expectedText = `
			const wrapper = render(<Component />);
		`;
		transformAndExpect(source, expectedText, 'wrapper');
	});

	it('should handle function declaration with shallow', () => {
		const source = `
			function mountComponent() {
				return shallow(<Component />);
			}
		`;
		const expectedText = `
			function mountComponent() {
				return render(<Component />);
			}
		`;
		transformAndExpect(source, expectedText, 'mountComponent');
	});

	it('should handle variable declaration with shallow', () => {
		const source = `
			const mountComponent = () => {
				return shallow(<Component />);
			};
		`;
		const expectedText = `
			const mountComponent = () => {
				return render(<Component />);
			};
		`;
		transformAndExpect(source, expectedText, 'mountComponent');
	});

	it('should rename render function to renderFunc to avoid conflicts', () => {
		const source = `
			function render() {
				return shallow(<Component />);
			}
			const result = render();
		`;
		const expectedText = `
			function renderFunc() {
				return render(<Component />);
			}
			const result = renderFunc();
		`;
		transformAndExpect(source, expectedText, 'renderFunc');
	});

	it('should throw error if no mount or shallow calls are found', () => {
		const source = `
			const wrapper = render(<Component />);
		`;
		const root = j(source);

		const result = convertMountShallowMethods(j, root);
		expect(result).toBeNull();

		expect(astLogger.warn).toHaveBeenCalledWith(
            'Did not find any Enzyme rendering methods: mount, shallow. Please make sure shallow/mount are not abstracted in a method outside of this test file and is imported directly from enzyme. Continuing without it...'
        );
	});

	it('should handle assignment expression with shallow', () => {
		const source = `
			let mountComponent;
			mountComponent = function() {
				return shallow(<Component />);
			};
		`;
		const expectedText = `
			let mountComponent;
			mountComponent = function() {
				return render(<Component />);
			};
		`;
		transformAndExpect(source, expectedText, 'mountComponent');
	});

	it.todo('many different calls in the same file')
});
