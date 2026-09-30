/**
 * PURPOSE: Lists every object-contract key that carries a brand text, whether it declares the brand
 * itself or points at a standalone brand contract with that text. Reach for this to answer "who
 * owns brand Y" for a brand that is not derivable from an owner name, such as an id declared under a
 * different text than its owner and key would give.
 *
 * USAGE:
 * ownerIndexBrandDeclarersTransformer({ ownerIndex, brandText: 'QuestId' });
 * // Returns OwnerIndexMatch[] — one per owner key whose own-brand or brand-ref text is QuestId
 */
import { ownerIndexMatchContract } from '../../contracts/owner-index-match/owner-index-match-contract';
import type { OwnerIndexMatch } from '../../contracts/owner-index-match/owner-index-match-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';

export const ownerIndexBrandDeclarersTransformer = ({
  ownerIndex,
  brandText,
}: {
  ownerIndex: OwnerIndex;
  brandText: string;
}): OwnerIndexMatch[] =>
  ownerIndex.owners.flatMap((owner) =>
    owner.fields
      .filter(
        (field) =>
          (field.kind === 'own-brand' || field.kind === 'brand-ref') &&
          field.brandText === brandText,
      )
      .map((field) => ownerIndexMatchContract.parse({ owner, field })),
  );
