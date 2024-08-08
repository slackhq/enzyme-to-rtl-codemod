import fs from 'fs';
import { mainASTtransform } from './main-ast-transform';
import { astLogger } from './utils/ast-logger';

jest.mock('./utils/ast-logger');

describe('main AST transform method', () => {
    const testId = 'data-id';

    it.only('TEST - delete after', () => {
        const inputFilePath =
            'src/support/ast-transformations/utils/test-data/ast-conversion-test-file-TEST.tsx';
        const expectedFilePath =
            'src/support/ast-transformations/utils/test-data/ast-conversion-test-file-verify.tsx';
        const astTransformedCodeActual = mainASTtransform(
            inputFilePath,
            testId,
        );

        console.log('astTransformedCodeActual:\n\n', astTransformedCodeActual);

        // const astTransformedCodeExpected = fs.readFileSync(
        //     expectedFilePath,
        //     'utf-8',
        // );
        // expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);
    });

    // it('should transform a tsx file with all conversion patterns', () => {
    //     const inputFilePath =
    //         'src/support/ast-transformations/utils/test-data/ast-conversion-test-file.tsx';
    //     const expectedFilePath =
    //         'src/support/ast-transformations/utils/test-data/ast-conversion-test-file-verify.tsx';
    //     const astTransformedCodeActual = mainASTtransform(
    //         inputFilePath,
    //         testId,
    //     );
    //     const astTransformedCodeExpected = fs.readFileSync(
    //         expectedFilePath,
    //         'utf-8',
    //     );
    //     expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);
    // });

    // it('should transform a jsx file with all conversion patterns', () => {
    //     const inputFilePath =
    //         'src/support/ast-transformations/utils/test-data/ast-conversion-test-file.jsx';
    //     const expectedFilePath =
    //         'src/support/ast-transformations/utils/test-data/ast-conversion-test-file-verify.jsx';
    //     const astTransformedCodeActual = mainASTtransform(
    //         inputFilePath,
    //         testId,
    //     );
    //     const astTransformedCodeExpected = fs.readFileSync(
    //         expectedFilePath,
    //         'utf-8',
    //     );
    //     expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);
    // });

    // it('should convert and not error out with no direct enzyme imports', () => {
    //     const inputFilePath =
    //         'src/support/ast-transformations/utils/test-data/ast-conversion-test-file-no-enzyme.tsx';
    //     const expectedFilePath =
    //         'src/support/ast-transformations/utils/test-data/ast-conversion-test-file-no-enzyme-verify.tsx';
    //     const astTransformedCodeActual = mainASTtransform(
    //         inputFilePath,
    //         testId,
    //     );
    //     const astTransformedCodeExpected = fs.readFileSync(
    //         expectedFilePath,
    //         'utf-8',
    //     );
    //     expect(astTransformedCodeActual).toBe(astTransformedCodeExpected);

    //     expect(astLogger.warn).toHaveBeenCalledWith(
    //         'Did not find any Enzyme rendering methods: mount, shallow. Please make sure shallow/mount are not abstracted in a method outside of this test file and is imported directly from enzyme. Continuing without it...',
    //     );
    //     expect(astLogger.warn).toHaveBeenCalledWith(
    //         'No abstracted renderFunction was found. Conitnue...',
    //     );
    // });
});
