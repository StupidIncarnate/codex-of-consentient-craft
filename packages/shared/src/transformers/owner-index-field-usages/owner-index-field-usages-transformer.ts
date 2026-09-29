/**
 * PURPOSE: Lists every other field that relates to one owner key: those that reuse it through
 * `ownerContract.shape.key`, those that point at a standalone brand with its text, and those that
 * declare an inline copy of its brand text. Reach for this to retype each site when an owner's key
 * becomes the one place the brand is declared.
 *
 * USAGE:
 * ownerIndexFieldUsagesTransformer({ ownerIndex, contractName: 'questContract', key: 'id' });
 * // Returns OwnerIndexUsage[] — kind owner-reuse, brand-ref or inline-copy, in index order
 */
import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { ownerIndexUsageContract } from '../../contracts/owner-index-usage/owner-index-usage-contract';
import type { OwnerIndexUsage } from '../../contracts/owner-index-usage/owner-index-usage-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';

export const ownerIndexFieldUsagesTransformer = ({
  ownerIndex,
  contractName,
  key,
}: {
  ownerIndex: OwnerIndex;
  contractName: Identifier;
  key: Identifier;
}): OwnerIndexUsage[] => {
  const targetTexts = new Set(
    ownerIndex.owners
      .filter((owner) => owner.contractName === contractName)
      .flatMap((owner) => owner.fields)
      .filter(
        (field) => field.key === key && (field.kind === 'own-brand' || field.kind === 'brand-ref'),
      )
      .flatMap((field) => (field.brandText === undefined ? [] : [field.brandText])),
  );

  return ownerIndex.owners.flatMap((owner) =>
    owner.fields.flatMap((field) => {
      const isTarget = owner.contractName === contractName && field.key === key;
      const kind = ((): OwnerIndexUsage['kind'] | undefined => {
        if (isTarget) {
          return undefined;
        }
        if (
          field.kind === 'owner-reuse' &&
          field.refContractName === contractName &&
          field.refKey === key
        ) {
          return 'owner-reuse';
        }
        if (field.brandText === undefined || !targetTexts.has(field.brandText)) {
          return undefined;
        }
        if (field.kind === 'own-brand') {
          return 'inline-copy';
        }
        return field.kind === 'brand-ref' ? 'brand-ref' : undefined;
      })();

      return kind === undefined
        ? []
        : [
            ownerIndexUsageContract.parse({
              filePath: owner.filePath,
              contractName: owner.contractName,
              key: field.key,
              kind,
            }),
          ];
    }),
  );
};
