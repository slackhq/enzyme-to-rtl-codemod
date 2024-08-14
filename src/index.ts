// Export one method to run all individual methods in one flow
export {
    convertTestFiles,
    LLMCallFunction,
} from './support/workflows/convert-test-files';

// Config initialization
export { initializeConfig } from './support/config/config';

// Export running individual methods directly
export { convertWithAST } from './support/ast-transformations/run-ast-transformations';
export { getReactCompDom } from './support/enzyme-helper/get-dom-enzyme';
export {
    generateInitialPrompt,
    generateFeedbackPrompt,
} from './support/prompt-generation/generate-prompt';
export { extractCodeContentToFile } from './support/code-extractor/extract-code';
export { runTestAndAnalyze } from './support/enzyme-helper/run-test-analysis';
