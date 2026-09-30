/**
 * PURPOSE: Lists the owners a file in one package can import: the package's own and those of the
 * workspace packages it lists as dependencies. Reach for this before matching a name, so an owner in
 * a package the file cannot reach never claims that file's names.
 *
 * USAGE:
 * ownerIndexOwnersReachableTransformer({ ownerIndex, packageName });
 * // Returns OwnerIndexOwner[] — own package first, then the dependencies' owners
 */
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';
import type { OwnerIndexOwner } from '../../contracts/owner-index-owner/owner-index-owner-contract';

export const ownerIndexOwnersReachableTransformer = ({
  ownerIndex,
  packageName,
}: {
  ownerIndex: OwnerIndex;
  packageName: string;
}): OwnerIndexOwner[] => {
  const dependencies =
    ownerIndex.packages.find((candidate) => candidate.name === packageName)?.dependencies ?? [];
  const reachable = new Set<string>([packageName, ...dependencies]);

  return [
    ...ownerIndex.owners.filter((owner) => owner.packageName === packageName),
    ...ownerIndex.owners.filter(
      (owner) => owner.packageName !== packageName && reachable.has(owner.packageName),
    ),
  ];
};
