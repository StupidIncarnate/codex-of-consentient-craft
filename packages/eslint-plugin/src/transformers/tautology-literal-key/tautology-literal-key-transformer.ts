/**
 * PURPOSE: Extracts a serialized key from an AST literal node for tautology comparison
 *
 * USAGE:
 * const key = tautologyLiteralKeyTransformer({ node });
 * // Returns a JSON-serialized string for literal nodes or null for non-literals
 *
 * WHEN-TO-USE: When comparing two AST nodes to detect identical literals in expect(X).toBe(X)
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const tautologyLiteralKeyTransformer = ({
  node,
}: {
  node: TSESTree.Node;
}): ReturnType<typeof JSON.stringify> | null => {
  if (node.type !== AST_NODE_TYPES.Literal) {
    if (
      node.type === AST_NODE_TYPES.Identifier &&
      (node.name === 'undefined' || node.name === 'NaN')
    ) {
      return node.name;
    }
    return null;
  }
  return JSON.stringify(node.value);
};
