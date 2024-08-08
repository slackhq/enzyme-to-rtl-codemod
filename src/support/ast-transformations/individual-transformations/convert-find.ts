/**
 * Query .find method calls and convert
 * 1. find('selector')
 * 1.1. if selector is a testid, getByTestID
 * 1.2. if selector is a role, getByRole
 * 1.3. if selector is a component, annotation
 */
import { JSCodeshift, Collection, CallExpression, ASTPath } from 'jscodeshift';
import { addComment } from '../utils/add-comment';
import { astLogger } from '../utils/ast-logger';
import { extractDataQaValue, getQueryMethod } from '../utils/selectors-logic';
/**
 * Convert Enzyme find method
 * @param j - JSCodeshift library
 * @param root  - root AST node
 * @param testId - This unique identifier which matches the 'data-testid' attribute.
 * @returns {void} - The function does not return a value but mutates the AST directly.
 */
export const convertFind = (
    j: JSCodeshift,
    root: Collection,
    testId: string,
): void => {
    astLogger.verbose('Querying for .find');
    // Find all call expressions with the callee property name 'find'
    const findCalls = root.find(j.CallExpression, {
        callee: {
            property: {
                name: 'find',
            },
        },
    });

    astLogger.verbose('Converting .find');
    // Iterate over each found call expression path and convert/annotate
    findCalls.forEach((path: ASTPath<CallExpression>) => {
        const arg = path.value.arguments[0];
        // Data QA (call expression) .find('[data-id="element"]')
        astLogger.verbose(
            'Converting Data QA (call expression) - [data-id="element"] ',
        );
        if (j.Literal.check(arg)) {
            const value = arg.value;
            if (typeof value === 'string' && value.includes(testId)) {
                const dataQaValue = extractDataQaValue(value, testId);
                const queryMethod = getQueryMethod(path);

                const testIdReplacement = j.callExpression(
                    j.memberExpression(
                        j.identifier('screen'),
                        j.identifier(`${queryMethod}TestId`),
                    ),
                    [j.literal(dataQaValue)],
                );

                j(path).replaceWith(testIdReplacement);
            }
            if (typeof value === 'string' && value.includes('[role=')) {
                // Role (call expression) .find('[role="<role>"]')
                astLogger.verbose(
                    'Converting role expressions - [role="<role>"]',
                );
                const roleValue = value
                    .replace('[role="', '')
                    .replace('"]', '');
                const roleReplacement = j.callExpression(
                    j.memberExpression(
                        j.identifier('screen'),
                        j.identifier('getByRole'),
                    ),
                    [j.literal(roleValue)],
                );
                j(path).replaceWith(roleReplacement);
            }
        }
        if (j.ObjectExpression.check(arg)) {
            // Data QA (object expression) find({ 'data-id': 'element' })
            astLogger.verbose(
                'Converting Data QA (object expression) - { "data-id": "element" }',
            );
            const dataQaProperty = arg.properties.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (property: any) => property.key.value === testId,
            );

            if (dataQaProperty) {
                if (j.ObjectProperty.check(dataQaProperty)) {
                    if (j.StringLiteral.check(dataQaProperty.value)) {
                        const dataQaValue = dataQaProperty.value.value;
                        const queryMethod = getQueryMethod(path);
                        const testIdReplacement = j.callExpression(
                            j.memberExpression(
                                j.identifier('screen'),
                                j.identifier(`${queryMethod}TestId`),
                            ),
                            [j.literal(dataQaValue)],
                        );

                        j(path).replaceWith(testIdReplacement);
                    }
                }
            }
        }
        // else {
        //     // TODO: add this here by default. If find is found in the add suggestion, then ignore, because it's already done here
        //     addComment(
        //         path,
        //         '/* SUGGESTION: .find("selector") --> getByRole("selector"), getByTestId("test-id-selector")*/',
        //     );
        // }
    });
};
