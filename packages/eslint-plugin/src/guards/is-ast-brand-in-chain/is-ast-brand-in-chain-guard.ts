import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

/**
 * Checks if a node has .brand() chained somewhere in its parent chain.
 * Used for validating Zod schemas have branded types.
 *
 * @example
 * // z.string().email().brand<'EmailAddress'>() - returns true
 * // z.string().email() - returns false
 */
export const isAstBrandInChainGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (!node) {
    return false;
  }

  let current = node.parent;

  while (current) {
    if (
      'property' in current &&
      typeof current.property === 'object' &&
      current.property !== null &&
      'name' in current.property &&
      current.property.name === 'brand'
    ) {
      return true;
    }
    current = current.parent;
  }

  return false;
};
