/**
 * PURPOSE: The brand text B3 expects at a node: its owner plus the keys down to it. A local field
 * list has no brand of its own, so its leaves take the text of the contract that spreads it. Reach
 * for this in a rule so the reported text, the comparison and the fix all come from one place.
 *
 * USAGE:
 * astExpectedBrandTextTransformer({ node: brandCall, fieldListOwners: new Map() });
 * // Returns 'QuestId' for a brand inside `id:` of `questContract`, null when no const owns the node
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { astBrandPathTransformer } from '../ast-brand-path/ast-brand-path-transformer';
import { brandTextDeriveTransformer } from '../brand-text-derive/brand-text-derive-transformer';

export const astExpectedBrandTextTransformer = ({
  node,
  fieldListOwners,
}: {
  node: Tsestree;
  fieldListOwners: ReadonlyMap<Identifier, Identifier>;
}): Identifier | null => {
  const [first, ...keys] = astBrandPathTransformer({ node });

  if (first === undefined) {
    return null;
  }

  return brandTextDeriveTransformer({ path: [fieldListOwners.get(first) ?? first, ...keys] });
};
