// Export running individual methods directly
export { converWithAST } from './support/ast-transformations/run-ast-transformations';
export { getReactCompDom } from './support/enzyme-helper/get-dom-enzyme';
export { generatePrompt } from './support/prompt-generation/generate-prompt';
export { extractCodeContentToFile } from './support/code-extractor/extract-code';
export { runTestAndAnalyze } from './support/enzyme-helper/run-test-analysis';
export {
    setJestBinaryPath,
    setOutputResultsPath,
    configureLogLevel,
} from './support/config';

// Export one method to run all individual methods in one flow
export { convertTestFiles } from './convert-test-files';
