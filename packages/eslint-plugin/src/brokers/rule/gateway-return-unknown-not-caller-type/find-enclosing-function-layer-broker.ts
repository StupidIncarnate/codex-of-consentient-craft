/**
 * PURPOSE: Walks a node's `.parent` chain up to the nearest enclosing function-like declaration —
 * a `ReturnStatement`'s own parent is its block, never the function, so callers that need the
 * function itself (its return type, its parameters) reach for this instead of one `.parent` hop.
 *
 * USAGE:
 * findEnclosingFunctionLayerBroker({ node: returnStatementNode.parent });
 * // Returns the nearest FunctionDeclaration/FunctionExpression/ArrowFunctionExpression ancestor,
 * // or undefined at the top of the chain
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const findEnclosingFunctionLayerBroker = ({
  node,
}: {
  node: TSESTree.Node | null | undefined;
}): TSESTree.Node | undefined => {
  if (!node) {
    return undefined;
  }

  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return node;
  }

  return findEnclosingFunctionLayerBroker({ node: node.parent });
};
