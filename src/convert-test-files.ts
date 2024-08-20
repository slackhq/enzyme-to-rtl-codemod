import { converWithAST } from './support/ast-transformations/run-ast-transformations';
import { getReactCompDom } from './support/enzyme-helper/get-dom-enzyme';
import { generatePrompt } from './support/prompt-generation/generate-prompt';
import { extractCodeContentToFile } from './support/code-extractor/extract-code';
import { runTestAndAnalyze } from './support/enzyme-helper/run-test-analysis';
import {
    setJestBinaryPath,
    setOutputResultsPath,
    configureLogLevel,
} from './support/config';

// Define the function type for LLM call
export type LLMCallFunction = (prompt: string) => Promise<string>;

export const convertTestFiles = async ({
    filePaths,
    logLevel,
    jestBinaryPath,
    outputResultsPath,
    testId,
    llmCallFunction,
    extendPrompt,
}: {
    filePaths: string[];
    logLevel?: string;
    jestBinaryPath: string;
    outputResultsPath: string;
    testId: string;
    llmCallFunction: LLMCallFunction;
    extendPrompt?: string[];
}): Promise<void> => {
    // Set log level
    if (logLevel) {
        configureLogLevel(logLevel);
    }

    // Set host project jest bin path
    setJestBinaryPath(jestBinaryPath);

    // Set host project results output path
    setOutputResultsPath(outputResultsPath);

    for (const filePath of filePaths) {
        // Get AST conversion
        const astConvertedCode = converWithAST(filePath, testId);

        // Get React Component DOM tree for each test case
        const reactCompDom = await getReactCompDom(filePath);

        // Generate the prompt
        const prompt = generatePrompt(
            filePath,
            'data-test',
            astConvertedCode,
            reactCompDom,
            extendPrompt,
        );

        // Call the API with a custom LLM method
        const LLMResponse = await llmCallFunction(prompt);

        // Extract generated code
        const convertedFilePath = extractCodeContentToFile(LLMResponse);

        // Run the file and analyze the failures
        await runTestAndAnalyze(convertedFilePath);
    }
};
