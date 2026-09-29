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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const validateFunctionParamsUseObjectDestructuringTransformer = ({
  node,
  context,
}: {
  node:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;
  context: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  if (node.params.length === 0) {
    return;
  }

  if (node.returnType?.typeAnnotation.type === AST_NODE_TYPES.TSTypePredicate) {
    return;
  }

  for (const param of node.params) {
    const isObjectDestructuring =
      param.type === AST_NODE_TYPES.ObjectPattern ||
      (param.type === AST_NODE_TYPES.AssignmentPattern &&
        param.left.type === AST_NODE_TYPES.ObjectPattern);

    if (!isObjectDestructuring) {
      context.report({
        node: param,
        messageId: 'useObjectDestructuring',
      });
    }
  }
};
