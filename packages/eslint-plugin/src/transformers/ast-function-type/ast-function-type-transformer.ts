/**
 * PURPOSE: Determines if an arrow function is a guard or transformer based on its return type
 *
 * USAGE:
 * const type = astFunctionTypeTransformer({ node: arrowFunctionNode });
 * // Returns 'guard' if return type is boolean
 * // Returns 'transformer' if return type is something else
 * // Returns 'unknown' if cannot determine
 *
 * WHEN-TO-USE: When validating function naming conventions based on their return types
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astFunctionTypeTransformer = ({
  node,
}: {
  node?: TSESTree.Node | undefined;
}): 'guard' | 'transformer' | 'unknown' => {
  if (node === undefined) {
    return 'unknown';
  }

  // Check if parent is VariableDeclarator to get return type annotation
  const { parent } = node;
  if (!parent || parent.type !== AST_NODE_TYPES.VariableDeclarator) {
    return 'unknown';
  }

  // Check if it's an arrow function with return type
  const arrowFunc = parent.init;
  if (arrowFunc?.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
    return 'unknown';
  }

  // Check return type annotation
  const { returnType } = arrowFunc;
  if (returnType === undefined) {
    return 'unknown';
  }

  // Type annotation structure: TSTypeAnnotation > TSBooleanKeyword
  const { typeAnnotation } = returnType;

  if (typeAnnotation.type === AST_NODE_TYPES.TSBooleanKeyword) {
    return 'guard';
  }

  return 'transformer';
};
