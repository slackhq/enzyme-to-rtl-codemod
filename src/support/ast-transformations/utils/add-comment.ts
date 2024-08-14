import type { ASTPath } from 'jscodeshift';

/**
 * Add comment to the top level Expression
 * @param currentPath
 * @param comment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addComment = (currentPath: ASTPath, comment: string): void => {
    // Get needed parent node
    const commonTopLevelNodeTypes = [
        'VariableDeclaration',
        'ExpressionStatement',
    ];

    const node = findParentNode(currentPath, commonTopLevelNodeTypes);
    if (node) {
        node.insertBefore(comment);
    }
};

/**
 * Find parent node
 * @param currentPath
 * @param type
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findParentNode = (currentPath: ASTPath, types: string[]): ASTPath => {
    let currentNode = currentPath;

    while (currentNode) {
        const parent = currentNode.parent;
        if (!parent) {
            return currentNode;
        }

        // Check if the parent type is in the array of top level types
        if (types.includes(parent.node.type)) {
            return parent;
        }

        currentNode = parent;
    }

    return currentNode;
};
