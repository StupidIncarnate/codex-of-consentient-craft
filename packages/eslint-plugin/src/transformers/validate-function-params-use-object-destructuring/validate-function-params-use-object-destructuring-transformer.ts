/**
 * PURPOSE: Validates that all function parameters use object destructuring pattern and reports ESLint errors if not
 *
 * USAGE:
 * // In an ESLint rule:
 * FunctionDeclaration(node) {
 *   validateFunctionParamsUseObjectDestructuringTransformer({ node, context });
 *   // Reports error if params don't use { param1, param2 } pattern
 * }
 *
 * WHEN-TO-USE: Within ESLint rule implementations to enforce object destructuring for function parameters
 */
import type { EslintContext } from '../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const validateFunctionParamsUseObjectDestructuringTransformer = ({
  node,
  context,
}: {
  node: Tsestree;
  context: EslintContext;
}): void => {
  // No params is fine
  if (!node.params || node.params.length === 0) {
    return;
  }

  // Skip validation for type predicates (TypeScript limitation: type predicates cannot reference destructured parameters)
  if (node.returnType?.typeAnnotation?.type === 'TSTypePredicate') {
    return;
  }

  // Check each parameter - all must use object destructuring
  for (const param of node.params) {
    // Check if parameter uses object destructuring
    const isObjectDestructuring =
      param.type === 'ObjectPattern' ||
      (param.type === 'AssignmentPattern' && param.left?.type === 'ObjectPattern');

    if (!isObjectDestructuring) {
      context.report({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    }
  }
};
