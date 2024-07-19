import fs from 'fs';
import type { Transform } from 'jscodeshift';
import { convertFind } from './individual-transformations/convert-find';
import { convertHostNodes } from './individual-transformations/remove-enzyme-hostNodes-method';
import { convertMountShallowMethods } from './individual-transformations/convert-mount-shallow-methods';
import { convertMountShallowVars } from './individual-transformations/convert-mount-shallow-vars';
import { convertUpdate } from './individual-transformations/remove-enzyme-update-method';

/**
 * Main tranformation function for jscodeshift
 * @param fileInfo
 * @param api
 */
const transform: Transform = (fileInfo, api, options) => {
    // Get jscodeshift api
    const j = api.jscodeshift;

    // Read file
    const root = j(fileInfo.source);

    // Convert enzyme imports
    // convertImports(j, root);

    /**
     * Convert mount and shallow to render
     * Step 1: Find all instances of mount and wrapper abstractions
     * Step 1.1: Convert .shallow(args), .mount(args) calls to render(args)
     */
    const abstractedFunctionName = convertMountShallowMethods(j, root);

    /**
     * Convert mount and shallow to render
     * Step 2: Collect variable names that reference shallow and mount calls
     */
    const renderFunctionVarNames = convertMountShallowVars(
        j,
        root,
        abstractedFunctionName,
    );

    // Convert find()
    convertFind(j, root);

    // Convert text()
    // convertText(j, root);

    // Convert simulate()
    // convertSimulate(j, root);
    // TODO: figure out if there are any simulate calls are left and add suggestions
    // Add suggestions
    // addSuggestionsSimulate(j, root);

    // Remove update()
    convertUpdate(j, root);

    // Remove hostNodes()
    convertHostNodes(j, root);

    // Remove first()
    // convertFirst(j, root);

    // Remove Wrapper ShallowWrapper and ReactWrapper Declaration
    // convertWrapperDeclarations(j, root);

    // Convert exists()
    // convertExists(j, root);

    // Add suggestions for any other instances of Enzyme methods based on renderFunctionVarNames

    // Output file to a temp folder
    const transformedCode = root.toSource();
    const outputFilePath = options.outputFile;
    fs.writeFileSync(outputFilePath, transformedCode, 'utf8');
};

export default transform;
