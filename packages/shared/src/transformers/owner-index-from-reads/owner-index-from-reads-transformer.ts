/**
 * PURPOSE: Merges per-file owner reads into the whole owner index, in the order the reads are given.
 * The merge is the one step that needs every file at once: a key that points at a standalone brand
 * contract by a name with exactly one brand text across all reads becomes a brand-ref carrying that
 * text. Reach for this over ownerIndexFromSourcesTransformer when the per-file reads already exist,
 * such as the files of an owner index cache shard, which carry the same three lists.
 *
 * USAGE:
 * ownerIndexFromReadsTransformer({ packages, reads });
 * // Returns OwnerIndex — owners, standaloneBrands, enums and packages
 */
import { ownerIndexFieldContract } from '../../contracts/owner-index-field/owner-index-field-contract';
import type { ContractFileOwnersReadLayer } from '../../contracts/contract-file-owners-read-layer/contract-file-owners-read-layer-contract';
import type { OwnerIndexEnum } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import type { OwnerIndexOwner } from '../../contracts/owner-index-owner/owner-index-owner-contract';
import type { OwnerIndexPackage } from '../../contracts/owner-index-package/owner-index-package-contract';
import type { OwnerIndexStandaloneBrand } from '../../contracts/owner-index-standalone-brand/owner-index-standalone-brand-contract';
import { ownerIndexContract } from '../../contracts/owner-index/owner-index-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';

export const ownerIndexFromReadsTransformer = ({
  packages,
  reads,
}: {
  packages: OwnerIndexPackage[];
  reads: Pick<ContractFileOwnersReadLayer, 'owners' | 'standaloneBrands' | 'enums'>[];
}): OwnerIndex => {
  const standaloneBrands: OwnerIndexStandaloneBrand[] = reads.flatMap(
    (read) => read.standaloneBrands,
  );

  const textsByName = new Map<string, Set<string>>();
  for (const { contractName, brandText } of standaloneBrands) {
    textsByName.set(
      contractName,
      (textsByName.get(contractName) ?? new Set<string>()).add(brandText),
    );
  }

  const owners: OwnerIndexOwner[] = reads
    .flatMap((read) => read.owners)
    .map((owner) => ({
      ...owner,
      fields: owner.fields.map((field) => {
        const texts =
          field.kind === 'contract-ref' && field.refContractName !== undefined
            ? [...(textsByName.get(field.refContractName) ?? [])]
            : [];
        const [onlyText] = texts;
        return texts.length === 1 && onlyText !== undefined
          ? ownerIndexFieldContract.parse({ ...field, kind: 'brand-ref', brandText: onlyText })
          : field;
      }),
    }));

  const enums: OwnerIndexEnum[] = reads.flatMap((read) => read.enums);

  return ownerIndexContract.parse({ owners, standaloneBrands, enums, packages });
};
