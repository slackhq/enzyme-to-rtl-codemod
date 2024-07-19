import fs from 'fs';
import { getConfigProperty } from '../config';
/**
 * Extract code content to a file
 * @param LLMresponse
 * @returns
 */
export const extractCodeContentToFile = (LLMresponse: string): string => {
    console.log('\nStart: Extracting code');

    // Extract code between tags
    const testCaseCode = extractCodeBetweenStrings(
        LLMresponse,
        '<rtl_test_code>',
        '</rtl_test_code>',
    );

    // Check if code was not extracted
    if (testCaseCode === 'Code not extracted') {
        console.log('\nCheck why code was not extracted');
        console.log('LLMresponse:', LLMresponse);
        // TODO: add some checks and reason why it didn't work
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
    console.log('\nStart: Extracting code between strings');

    // Define regex to extract code
    const patternString = `${startString}([\\s\\S]*?)${endString}`;
    const pattern = new RegExp(patternString);

    const match: RegExpMatchArray | null = inputString.match(pattern);

    if (match) {
        const extractedCode: string = match[1];
        return extractedCode;
    }
    console.log('Done: Extracting code between strings');
    return 'Code not extracted';
};
