import fs from 'fs';
import { createCustomLogger } from '../logger/logger';

export const codeExtractorLogger = createCustomLogger('Extract Code');

/**
 * Extract code content from an LLM response and write it to a file.
 *
 * This function parses the LLM response for code enclosed in `<rtl_test_code>` tags
 * and writes the extracted code to the specified file path. If the extraction fails,
 * an error is thrown with detailed logging information.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.LLMresponse - The response from the LLM containing the code to extract.
 * @param {string} params.rtlConvertedFilePath - The file path where the extracted code will be saved.
 * @returns {string} The path to the file where the extracted code is written.
 * @throws Will throw an error if the code cannot be extracted from the LLM response.
 */
export const extractCodeContentToFile = ({
    LLMresponse,
    rtlConvertedFilePath,
}: {
    LLMresponse: string;
    rtlConvertedFilePath: string;
}): string => {
    codeExtractorLogger.info('Start: Extracting code from the LLM response');

    // Extract code between tags
    const testCaseCode = extractCodeBetweenStrings(
        LLMresponse,
        '<rtl_test_code>',
        '</rtl_test_code>',
    );

    // Check if code was not extracted
    if (testCaseCode === 'Code not extracted') {
        codeExtractorLogger.error(
            'Could not extract code from the LLM response',
        );
        codeExtractorLogger.error(`LLM response: ${LLMresponse}`);
        codeExtractorLogger.error(
            'Possible reasons: \n1. No LLM response was passed\n2. LLM did not return the code enclosed in <rtl_test_code>...</rtl_test_code> xml tags.\n3. Check if LLM is returning the response with the expected text',
        );
        throw new Error('Could not extract code from the LLM response');
    }

    // Write extracted code to file
    fs.writeFileSync(`${rtlConvertedFilePath}`, testCaseCode, 'utf-8');

    codeExtractorLogger.info('Done: extracting code from the LLM response');
    return rtlConvertedFilePath;
};

/**
 * Extract code between strings
 * @param inputString
 * @param startString
 * @param endString
 * @returns
 */
const extractCodeBetweenStrings = (
    inputString: string,
    startString: string,
    endString: string,
): string => {
    codeExtractorLogger.verbose(
        `Extracting code between ${startString} and ${endString}`,
    );

    // Define regex to extract code
    const patternString = `${startString}([\\s\\S]*?)${endString}`;
    const pattern = new RegExp(patternString);

    const match: RegExpMatchArray | null = inputString.match(pattern);

    if (match) {
        const extractedCode: string = match[1];
        codeExtractorLogger.verbose(
            `Code between ${startString} and ${endString} extracted`,
        );

        return extractedCode;
    }
    codeExtractorLogger.warn(
        `Extracting code between ${startString} and ${endString} failed!`,
    );
    return 'Code not extracted';
};
