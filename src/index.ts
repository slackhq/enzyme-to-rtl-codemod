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

// Export one method to run all individual methond in one flow
export { convertTestFile } from './convert-test-file';

//


// Workflows
/**
 * Individual methods with config - programmatic
 * 1. Initialize config from file
 * 2. export everything directly
 */

/**
 * Individual methods without config - programmatic
 * 1. export everything directly
 */

/**
 * One method conversion with config - programmatic
 * 1. Initialize config from file
 * 2. Run convertTestFile
 */

/**
 * One method conversion without config - programmatic
 * 1. Run convertTestFile and set everything in that method
 */

/**
 * CLI with config - cli
 * 1. Run convertTestFile and set everything in that method
 */

/**
 * CLI without config - cli
 * 1. Run convertTestFile and set everything in that method
 */