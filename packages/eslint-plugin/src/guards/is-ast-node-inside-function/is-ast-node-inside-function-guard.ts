/**
 * PURPOSE: Checks if an AST node is nested inside a function in its parent chain
 *
 * USAGE:
 * const varNode = // AST node for variable inside: const outer = () => { const inner = 5; }
 * if (isAstNodeInsideFunctionGuard({ node: varNode })) {
 *   // Node is inside a function (arrow, expression, or declaration)
 * }
 * // Returns true if any parent is a function type
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstNodeInsideFunctionGuard = ({
  node,
}: {
  node?: TSESTree.Node | undefined;
}): boolean => {
  if (node === undefined) {
    return false;
  }
  let current = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
};
