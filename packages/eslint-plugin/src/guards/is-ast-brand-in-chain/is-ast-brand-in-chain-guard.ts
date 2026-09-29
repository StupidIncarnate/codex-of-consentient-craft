/**
 * PURPOSE: Checks if a node has .brand() chained somewhere in its parent chain, used for validating Zod schemas have branded types.
 *
 * USAGE:
 * isAstBrandInChainGuard({ node: astNode })
 * // Returns true for z.string().email().brand<'EmailAddress'>(), false for z.string().email()
 */
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstBrandInChainGuard = ({ node }: { node?: TSESTree.Node }): boolean => {
  if (!node) {
    return false;
  }

  let current = node.parent;

  while (current) {
    if (
      'property' in current &&
      typeof current.property === 'object' &&
      'name' in current.property &&
      current.property.name === 'brand'
    ) {
      return true;
    }
    current = current.parent;
  }

  return false;
};
