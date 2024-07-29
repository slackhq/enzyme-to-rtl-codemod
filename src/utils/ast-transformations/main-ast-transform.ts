import fs from 'fs';
import jscodeshift from 'jscodeshift';
import { convertFind } from './individual-transformations/convert-find';
import { convertHostNodes } from './individual-transformations/remove-enzyme-hostNodes-method';
import { convertImports } from './individual-transformations/convert-enzyme-imports';
import { convertMountShallowMethods } from './individual-transformations/convert-mount-shallow-methods';
import { convertMountShallowVars } from './individual-transformations/convert-mount-shallow-vars';
import { convertSimulate } from './individual-transformations/convert-simulate';
import { convertText } from './individual-transformations/convert-enzyme-text-method';
import { convertUpdate } from './individual-transformations/remove-enzyme-update-method';
import { astLogger } from './utils/ast-logger';

/**
 * Main tranformation function for jscodeshift
 * @param filePath
 * @returns
 */
export const mainASTtransform = (filePath: string): string => {
    // Read the file content
    astLogger.verbose('Reading Enzyme source file');
    const source = fs.readFileSync(filePath, 'utf-8');

    // Use jscodeshift to parse the source
    astLogger.verbose('Parse code with jscodeshift');
    const j = jscodeshift;
    const root = j(source);

    // Set tsx flag
    j.withParser('tsx');

    // Convert enzyme imports
    astLogger.verbose('Convert imports');
    convertImports(j, root);

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
    convertFind(j, root);

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

    // Remove first()
    // astLogger.verbose('Convert first()');
    // convertFirst(j, root);

    // Remove Wrapper ShallowWrapper and ReactWrapper Declaration
    // astLogger.verbose('Convert convertWrapperDeclarations()');
    // convertWrapperDeclarations(j, root);

    // Convert exists()
    // astLogger.verbose('Convert exists()');
    // convertExists(j, root);

    // Generate the transformed code
    astLogger.verbose('Generating transformed code');
    const transformedCode = root.toSource();

    return transformedCode;
};

// const code = mainASTtransform('test/data/ast-conversion-test-file-no-enzyme.tsx')
// console.log('code:', code)
