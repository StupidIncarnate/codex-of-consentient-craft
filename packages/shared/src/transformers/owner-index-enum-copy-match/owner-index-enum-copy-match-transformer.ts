/**
 * PURPOSE: Finds the enum a `z.enum([...])` in a contract file copies: a standalone enum contract the
 * file's package can import whose value set is identical, else an inline enum of another object
 * contract with the same value set. The enum being checked is skipped by its own contract name, so it
 * never matches itself. Reach for this over ownerIndexObjectCopyMatchTransformer when the question is
 * a set of values, not a shape.
 *
 * USAGE:
 * ownerIndexEnumCopyMatchTransformer({ ownerIndex, packageName, enumText, contractName });
 * // Returns the matching OwnerIndexEnum — a standalone one has no key, an inline one carries its key — or undefined
 */
import type { OwnerIndexEnum } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';
import { enumValuesReadTransformer } from '../enum-values-read/enum-values-read-transformer';
import { ownerIndexOwnersReachableTransformer } from '../owner-index-owners-reachable/owner-index-owners-reachable-transformer';
import { inlineEnumsReadLayerTransformer } from './inline-enums-read-layer-transformer';

export const ownerIndexEnumCopyMatchTransformer = ({
  ownerIndex,
  packageName,
  enumText,
  contractName,
}: {
  ownerIndex: OwnerIndex;
  packageName: string;
  enumText: string;
  contractName: string;
}): OwnerIndexEnum | undefined => {
  const wanted = enumValuesReadTransformer({ text: enumText })?.join('\u0000');
  if (wanted === undefined) {
    return undefined;
  }

  const dependencies =
    ownerIndex.packages.find((candidate) => candidate.name === packageName)?.dependencies ?? [];
  const reachable = new Set<string>([packageName, ...dependencies]);

  const standalone = ownerIndex.enums.find(
    (candidate) =>
      candidate.contractName !== contractName &&
      reachable.has(candidate.packageName) &&
      candidate.values.join('\u0000') === wanted,
  );
  return (
    standalone ??
    ownerIndexOwnersReachableTransformer({ ownerIndex, packageName })
      .filter((owner) => owner.contractName !== contractName)
      .flatMap((owner) => inlineEnumsReadLayerTransformer({ owner }))
      .find((candidate) => candidate.values.join('\u0000') === wanted)
  );
};
