import fs from 'fs';
import { getConfigProperty } from '../config';
import createCustomLogger from '../logger/logger';

export const codeExtractorLogger = createCustomLogger('Extract Code');

/**
 * Extract code content to a file
 * @param LLMresponse
 * @returns
 */
export const extractCodeContentToFile = (LLMresponse: string): string => {
    codeExtractorLogger.info('Extracting code from the LLM response');

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
    const rtlConvertedFilePath = getConfigProperty('rtlConvertedFilePath');
    fs.writeFileSync(`${rtlConvertedFilePath}`, testCaseCode, 'utf8');

    console.log('Done: Extracting code');
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
