/**
 * PURPOSE: Lists the inline `z.enum([...])` values an object contract declares directly under its
 * keys, each as an OwnerIndexEnum that carries the key. A key whose value is not a literal enum, or a
 * nested object, contributes nothing.
 *
 * USAGE:
 * inlineEnumsReadLayerTransformer({ owner });
 * // Returns OwnerIndexEnum[] — one per key holding a literal `z.enum`, in written order
 */
import type { OwnerIndexEnum } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import { ownerIndexEnumContract } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import type { OwnerIndexOwner } from '../../contracts/owner-index-owner/owner-index-owner-contract';
import { enumValuesReadTransformer } from '../enum-values-read/enum-values-read-transformer';
import { schemaObjectEntriesReadTransformer } from '../schema-object-entries-read/schema-object-entries-read-transformer';

export const inlineEnumsReadLayerTransformer = ({
  owner,
}: {
  owner: OwnerIndexOwner;
}): OwnerIndexEnum[] =>
  schemaObjectEntriesReadTransformer({ text: owner.schemaText }).flatMap(({ key, valueText }) => {
    const values = enumValuesReadTransformer({ text: valueText });
    return values === undefined
      ? []
      : [
          ownerIndexEnumContract.parse({
            ownerName: owner.ownerName,
            contractName: owner.contractName,
            filePath: owner.filePath,
            packageName: owner.packageName,
            key,
            values,
          }),
        ];
  });
