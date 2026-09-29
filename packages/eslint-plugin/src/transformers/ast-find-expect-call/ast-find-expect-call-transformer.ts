/**
 * PURPOSE: Walks the callee chain of an assertion call to find the originating expect() CallExpression
 *
 * USAGE:
 * const expectNode = astFindExpectCallTransformer({ node });
 * // Returns the expect() CallExpression node or null if the call is not on an expect chain
 *
 * WHEN-TO-USE: When detecting assertion patterns on expect() chains regardless of which matcher is used,
 * including chains through .not, .resolves, .rejects
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astFindExpectCallTransformer = ({
  node,
}: {
  node: TSESTree.Node;
}): TSESTree.CallExpression | null => {
  const callee =
    node.type === AST_NODE_TYPES.CallExpression || node.type === AST_NODE_TYPES.NewExpression
      ? node.callee
      : undefined;
  if (callee?.type !== AST_NODE_TYPES.MemberExpression) {
    return null;
  }

  let current = callee.object;

  // Walk through MemberExpression chains (.not, .resolves, .rejects)
  const maxChainDepth = 5;
  let depth = 0;
  while (depth < maxChainDepth) {
    if (current.type === AST_NODE_TYPES.CallExpression) {
      const isExpect =
        current.callee.type === AST_NODE_TYPES.Identifier && current.callee.name === 'expect';
      if (isExpect) {
        return current;
      }
      return null;
    }
    if (current.type === AST_NODE_TYPES.MemberExpression) {
      current = current.object;
      depth += 1;
    } else {
      return null;
    }
  }

  return null;
};
