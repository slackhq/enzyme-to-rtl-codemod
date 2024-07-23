import fs from 'fs';
import { mainASTtransform } from '../src/utils/ast-transformations/main-ast-transform';
import { astLogger } from '../src/utils/ast-transformations/utils/ast-logger';

jest.mock('../src/utils/ast-transformations/utils/ast-logger');

describe('main AST transform method', () => {

    it('should transform a tsx file with all conversion patterns', () => {
        const inputFilePath = 'test/data/ast-conversion-test-file.tsx';
        const expectedFilePath = 'test/data/ast-conversion-test-file-verify.tsx';
        const astTransformedCodeActual = mainASTtransform(inputFilePath);
        const astTransformedCodeExpected = fs.readFileSync(expectedFilePath, 'utf-8');
        expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);
    });

    it('should transform a jsx file with all conversion patterns', () => {
        const inputFilePath = 'test/data/ast-conversion-test-file.jsx';
        const expectedFilePath = 'test/data/ast-conversion-test-file-verify.jsx';
        const astTransformedCodeActual = mainASTtransform(inputFilePath);
        const astTransformedCodeExpected = fs.readFileSync(expectedFilePath, 'utf-8');
        expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);
    });

    it('should convert and not error out with no direct enzyme imports', () => {
        const inputFilePath = 'test/data/ast-conversion-test-file-no-enzyme.tsx';
        const expectedFilePath = 'test/data/ast-conversion-test-file-no-enzyme-verify.tsx';
        const astTransformedCodeActual = mainASTtransform(inputFilePath);
        const astTransformedCodeExpected = fs.readFileSync(expectedFilePath, 'utf-8');
        expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);

        expect(astLogger.warn).toHaveBeenCalledWith(
            'Did not find any Enzyme rendering methods: mount, shallow. Please make sure shallow/mount are not abstracted in a method outside of this test file and is imported directly from enzyme. Continuing without it...'
        );
        expect(astLogger.warn).toHaveBeenCalledWith(
            'No abstracted renderFunction was found. Conitnue...'
        );
    });
});