/**
 * PURPOSE: Extracts a serialized key from an AST literal node for tautology comparison
 *
 * USAGE:
 * const key = tautologyLiteralKeyTransformer({ node });
 * // Returns a JSON-serialized string for literal nodes or null for non-literals
 *
 * WHEN-TO-USE: When comparing two AST nodes to detect identical literals in expect(X).toBe(X)
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const tautologyLiteralKeyTransformer = ({
  node,
}: {
  node: Tsestree;
}): ReturnType<typeof JSON.stringify> | null => {
  if (node.type !== 'Literal') {
    if (node.type === 'Identifier' && (node.name === 'undefined' || node.name === 'NaN')) {
      return String(node.name);
    }
    return null;
  }
  return JSON.stringify(node.value);
};
