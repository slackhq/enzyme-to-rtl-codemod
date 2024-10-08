import fs from 'fs';
import { extractCodeContentToFile, codeExtractorLogger } from './extract-code';

// Mock fs.writeFileSync
jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

describe('extractCodeContentToFile', () => {
    const rtlConvertedFilePathExpected = '/path/to/file';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should extract code content and write to file', () => {
        const LLMresponse = `Here is the converted test code
            <rtl_test_code>
            console.log("test")
            </rtl_test_code>
            The key changes are:

            1. Converted test case code from Enzyme to RTL
            The output meets all specified conditions.`;
        const rtlConvertedFilePath = extractCodeContentToFile({
            LLMresponse,
            rtlConvertedFilePath: rtlConvertedFilePathExpected,
        });

        expect(rtlConvertedFilePath).toBe(rtlConvertedFilePath);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            rtlConvertedFilePath,
            `
            console.log("test")
            `,
            'utf-8',
        );
    });

    it('should throw an error if code is not extracted due to wrong xml tags', () => {
        const LLMresponse = `Here is the converted test code
        <rtl_code>
        console.log("test")
        </rtl_code>
        The key changes are:

        1. Converted test case code from Enzyme to RTL
        The output meets all specified conditions.`;

        expect(() =>
            extractCodeContentToFile({
                LLMresponse,
                rtlConvertedFilePath: rtlConvertedFilePathExpected,
            }),
        ).toThrow('Could not extract code from the LLM response');
    });

    it('should throw an error if code is not extracted due to empty string', () => {
        const LLMresponse = '';

        expect(() =>
            extractCodeContentToFile({
                LLMresponse,
                rtlConvertedFilePath: rtlConvertedFilePathExpected,
            }),
        ).toThrow('Could not extract code from the LLM response');
    });

    it('should throw an error if code is not extracted due to LLM response cut off', () => {
        const LLMresponse = `Here is the converted test code
        <rtl_code>
        console.log("te`;

        const spyWarn = jest.spyOn(codeExtractorLogger, 'warn');
        const spyError = jest.spyOn(codeExtractorLogger, 'error');

        expect(() =>
            extractCodeContentToFile({
                LLMresponse,
                rtlConvertedFilePath: rtlConvertedFilePathExpected,
            }),
        ).toThrow('Could not extract code from the LLM response');

        expect(spyWarn).toHaveBeenNthCalledWith(
            1,
            'Extracting code between <rtl_test_code> and </rtl_test_code> failed!',
        );
        expect(spyError).toHaveBeenNthCalledWith(
            1,
            'Could not extract code from the LLM response',
        );
        expect(spyError).toHaveBeenNthCalledWith(
            2,
            `LLM response: Here is the converted test code
        <rtl_code>
        console.log("te`,
        );
        expect(spyError).toHaveBeenNthCalledWith(
            3,
            'Possible reasons: \n1. No LLM response was passed\n2. LLM did not return the code enclosed in <rtl_test_code>...</rtl_test_code> xml tags.\n3. Check if LLM is returning the response with the expected text',
        );
    });
});
