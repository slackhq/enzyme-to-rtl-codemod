import { getASTCodemodCode } from './utils/ast-transformations/run-ast-transformations';
import { getReactCompDom } from './utils/enzyme-helper/get-dom-enzyme';
import { genPrompt } from './utils/prompt-generation/generate-prompt';
import { extractCodeContentToFile } from './utils/code-extractor/extract-code';
import {
    runTestAndAnalyzeFile,
    RTLTestResult,
} from './utils/enzyme-helper/run-test-analysis';
import {
    setJestBinaryPath,
    setOutputResultsPath,
    configureLogLevel,
} from './utils/config';

/**
 * TODO:
 * 2. Promisify node process in shell helper (?)
 * 7. Figure out if Provider with test store needs to be passed in
 */
// Export configuration methods
export { setJestBinaryPath, setOutputResultsPath, configureLogLevel };

// Convert with AST
export const converWithAST = (filePath: string, testId: string): string =>
    getASTCodemodCode(filePath, testId);

// Get rendered component DOM
export const getReactComponentDOM = async (filePath: string): Promise<string> =>
    getReactCompDom(filePath);

// Generate prompt
export const generatePrompt = (
    filePath: string,
    getByTestIdAttribute = 'data-testid',
    astCodemodOutput: string,
    renderedCompCode: string,
): string =>
    genPrompt(
        filePath,
        getByTestIdAttribute,
        astCodemodOutput,
        renderedCompCode,
    );

// Extract code
export const extractCodeContent = (LLMresponse: string): string =>
    extractCodeContentToFile(LLMresponse);

// Run generated file and announce result
export const runTestAndAnalyze = (filePath: string): Promise<RTLTestResult> =>
    runTestAndAnalyzeFile(filePath);
