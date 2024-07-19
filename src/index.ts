import { getASTCodemodCode } from './utils/ast-transformations/run-ast-transformations';
import { getReactCompDom } from './utils/enzyme-helper/get-dom-enzyme';
import { genPrompt } from './utils/prompt-generation/generate-prompt';
import { extractCodeContentToFile } from './utils/code-extractor/extract-code';
import { runTestAndAnalyzeFile } from './utils/enzyme-helper/run-test-analysis';
import { setJestBinaryPath, setOutputResultsPath } from './utils/config';

/**
 * TODO:
 * 1. Logic to get file extension, e.g. .js or .ts - DONE
 * 2. Promisify node process in shell helper (?)
 * 3. Add better results output - DONE
 * 4. Add start of the process with all the info - DONE
 * 5. Convert all functions to arrow functions
 * 6. Add finish message with % success rate - DONE
 * 7. Figure out if Provider with test store needs to be passed in
 */
// Export configuration methods
export { setJestBinaryPath, setOutputResultsPath };

// Convert with AST
export const converWithAST = (filePath: string) => getASTCodemodCode(filePath);

// Get rendered component DOM
export const getReactComponentDOM = (filePath: string) =>
    getReactCompDom(filePath);

// Generate prompt
export const generatePrompt = (
    filePath: string,
    getByTestIdAttribute = 'data-testid',
    astCodemodOutput: string,
    renderedCompCode: string,
) =>
    genPrompt(
        filePath,
        getByTestIdAttribute,
        astCodemodOutput,
        renderedCompCode,
    );

// Extract code
export const extractCodeContent = (LLMresponse: string) =>
    extractCodeContentToFile(LLMresponse);

// Run generated file and announce result
export const runTestAndAnalyze = (filePath: string) =>
    runTestAndAnalyzeFile(filePath);
