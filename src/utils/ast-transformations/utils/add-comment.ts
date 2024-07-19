import type { ASTPath } from 'jscodeshift';

/**
 * Add comment to the top level Expression
 * @param currentPath
 * @param comment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addComment = (currentPath: ASTPath<any>, comment: string) => {
    // Get needed parent node
    // TODO: check on more Enzyme files
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
export const findParentNode = (currentPath: ASTPath<any>, types: string[]) => {
    let currentNode = currentPath;

    // while (currentNode && currentNode.getValueProperty('type') !== type) {
    // 	currentNode = currentNode.parent;
    // }
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
