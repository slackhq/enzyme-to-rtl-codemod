import fs from 'fs';
import {
    extractCodeContentToFile,
    codeExtractorLogger,
} from '../src/utils/code-extractor/extract-code';
import * as config from '../src/utils/config';

// Mock the getConfigProperty function
jest.mock('../src/utils/config', () => ({
    getConfigProperty: jest.fn(),
}));
// jest.mock('../src/utils/code-extractor/extract-code', () => ({
//     codeExtractorLogger: jest.fn(),
// }));

// Mock fs.writeFileSync
jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

describe('extractCodeContentToFile', () => {
    const getConfigPropertyMock = config.getConfigProperty as jest.Mock;
    const rtlConvertedFilePathExpected = '/path/to/file';

    beforeEach(() => {
        jest.clearAllMocks();
        getConfigPropertyMock.mockReturnValue(rtlConvertedFilePathExpected);
    });

    it('should extract code content and write to file', () => {
        const LLMresponse = `Here is the converted test code
            <rtl_test_code>
            console.log("test")
            </rtl_test_code>
            The key changes are:

            1. Converted test case code from Enzyme to RTL
            The output meets all specified conditions.`;
        const rtlConvertedFilePath = extractCodeContentToFile(LLMresponse);

        expect(rtlConvertedFilePath).toBe(rtlConvertedFilePath);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            rtlConvertedFilePath,
            `
            console.log("test")
            `,
            'utf8',
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

        expect(() => extractCodeContentToFile(LLMresponse)).toThrow(
            'Could not extract code from the LLM response',
        );
    });

    it('should throw an error if code is not extracted due to empty string', () => {
        const LLMresponse = '';

        expect(() => extractCodeContentToFile(LLMresponse)).toThrow(
            'Could not extract code from the LLM response',
        );

        // const consoleLogSpy = jest.spyOn(console, 'log');
        // expect(consoleLogSpy).toHaveBeenCalledWith(
        //     '\nCheck why code was not extracted',
        // );
        // expect(consoleLogSpy).toHaveBeenCalledWith('LLMresponse:', LLMresponse);

        // consoleLogSpy.mockRestore();
    });

    it.only('should throw an error if code is not extracted due to LLM response cut off', () => {
        const LLMresponse = `Here is the converted test code
        <rtl_code>
        console.log("te`;

        const spyWarn = jest.spyOn(codeExtractorLogger, 'warn');
        const spyError = jest.spyOn(codeExtractorLogger, 'error');

        expect(() => extractCodeContentToFile(LLMresponse)).toThrow(
            'Could not extract code from the LLM response',
        );

        expect(spyWarn).toHaveBeenNthCalledWith(
            1,
            'Extracting code between <rtl_test_code> and </rtl_test_code> failed!'
          );
          expect(spyError).toHaveBeenNthCalledWith(
            1,
            'Could not extract code from the LLM response'
          );
        //   expect(spyError).toHaveBeenNthCalledWith(
        //     2,
        //     `LLM response: Here is the converted test code
        //     <rtl_code>
        //     console.log("te`
        //   );
          expect(spyError).toHaveBeenNthCalledWith(
            3,
            `Possible reasons: 
      1. No LLM response was passed
      2. LLM did not return the code enclosed in <rtl_test_code>...</rtl_test_code> xml tags.
      3. Check if LLM is returning the response with the expected text`
          );
    });
});
