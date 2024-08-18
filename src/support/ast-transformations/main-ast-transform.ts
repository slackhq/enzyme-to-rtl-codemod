import fs from 'fs';
import jscodeshift from 'jscodeshift';
import { convertExists } from './individual-transformations/convert-exists';
import { convertFind } from './individual-transformations/convert-find';
import { convertHostNodes } from './individual-transformations/remove-enzyme-hostNodes-method';
import { convertImports } from './individual-transformations/convert-enzyme-imports';
import { convertMountShallowMethods } from './individual-transformations/convert-mount-shallow-methods';
import { convertMountShallowVars } from './individual-transformations/convert-mount-shallow-vars';
import { convertSimulate } from './individual-transformations/convert-simulate';
import { convertText } from './individual-transformations/convert-enzyme-text-method';
import { convertUpdate } from './individual-transformations/remove-enzyme-update-method';
import { convertFirst } from './individual-transformations/remove-enzyme-first-method';
import { addSuggestions } from './individual-transformations/add-suggestions';
import { astLogger } from './utils/ast-logger';

/**
 * Main tranformation function for jscodeshift
 * @param filePath
 * @param testId - This unique identifier which matches the 'data-testid' attribute.

 * @returns
 */
export const mainASTtransform = (filePath: string, testId: string): string => {
    // Read the file content
    astLogger.verbose('Reading Enzyme source file');
    const source = fs.readFileSync(filePath, 'utf-8');

    // Use jscodeshift to parse the source with tsx flag
    astLogger.verbose('Parse code with jscodeshift');
    const j = jscodeshift.withParser('tsx');

    const root = j(source);

    // Convert Enzyme and relative imports
    astLogger.verbose('Convert imports');
    convertImports(j, root, filePath);

    /**
     * Convert mount and shallow to render
     * Step 1: Find all instances of mount and wrapper abstractions
     * Step 1.1: Convert .shallow(args), .mount(args) calls to render(args)
     */
    astLogger.verbose('Convert mount/shallow methods');
    const abstractedFunctionName = convertMountShallowMethods(j, root);

    /**
     * Convert mount and shallow to render
     * Step 2: Collect variable names that reference shallow and mount calls
     */
    astLogger.verbose('Convert mount/shallow vars');
    const renderFunctionVarNames = convertMountShallowVars(
        j,
        root,
        abstractedFunctionName,
    );

    // Convert find()
    astLogger.verbose('Convert find()');
    convertFind(j, root, testId);

    // Convert text()
    astLogger.verbose('Convert text()');
    convertText(j, root);

    // Convert simulate()
    astLogger.verbose('Convert simulate()');
    convertSimulate(j, root);

    // Convert update()
    astLogger.verbose('Convert update()');
    convertUpdate(j, root);

    // Convert hostNodes()
    astLogger.verbose('Convert hostNodes()');
    convertHostNodes(j, root);

    // Convert first()
    astLogger.verbose('Convert first()');
    convertFirst(j, root);

    // Convert exists()
    astLogger.verbose('Convert exists()');
    convertExists(j, root);

    // Find remaining Enzyme methods and add suggestions
    astLogger.verbose('Add suggestions for remanining methods');
    addSuggestions(j, root, renderFunctionVarNames);

    // Generate the transformed code
    astLogger.verbose('Generating transformed code');
    const transformedCode = root.toSource();

    return transformedCode;
};
