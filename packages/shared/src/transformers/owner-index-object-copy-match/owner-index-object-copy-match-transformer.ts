/**
 * PURPOSE: Finds the object contract a nested `z.object(...)` copies: one the file's package can
 * import that has the same keys, each with the same schema once brand texts and whitespace are
 * ignored. A whole copy only; a subset of keys matches nothing, and an object with no keys matches
 * nothing. Reach for this over ownerIndexNameMatchTransformer when the question is a shape, not a name.
 *
 * USAGE:
 * ownerIndexObjectCopyMatchTransformer({ ownerIndex, packageName, objectText, contractName });
 * // Returns the first reachable OwnerIndexOwner with the same keys and schemas, own package first, or undefined
 */
import type { Identifier } from '../../contracts/identifier/identifier-contract';
import type { OwnerIndexOwner } from '../../contracts/owner-index-owner/owner-index-owner-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import { ownerIndexOwnersReachableTransformer } from '../owner-index-owners-reachable/owner-index-owners-reachable-transformer';
import { objectSignatureLayerTransformer } from './object-signature-layer-transformer';

export const ownerIndexObjectCopyMatchTransformer = ({
  ownerIndex,
  packageName,
  objectText,
  contractName,
}: {
  ownerIndex: OwnerIndex;
  packageName: PackageName;
  objectText: string;
  contractName: Identifier;
}): OwnerIndexOwner | undefined => {
  const wanted = objectSignatureLayerTransformer({ text: objectText });
  return wanted === undefined
    ? undefined
    : ownerIndexOwnersReachableTransformer({ ownerIndex, packageName }).find(
        (owner) =>
          owner.contractName !== contractName &&
          objectSignatureLayerTransformer({ text: owner.schemaText }) === wanted,
      );
};
