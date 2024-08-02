import fs from 'fs';

/**
 * Count number of it blocks in a file
 * @param filePath
 * @returns
 */
export const countTestCases = (filePath: string): number => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const testCasePattern =
        /(?<=(^|\t|\s))(it\s*\(|it.each\s*\(|it.each\s*`|test\s*\(|test.each\s*\(|test.each\s*`)/g;
    const testCaseMatches = fileContent.match(testCasePattern);
    return testCaseMatches ? testCaseMatches.length : 0;
};
