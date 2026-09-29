/**
 * PURPOSE: Names the workspace package a linted file sits in, from the owner index's package
 * directories. Reach for this before asking the index who owns a name, since reachability starts from
 * the file's own package. The deepest directory that holds the file wins, so a package nested under
 * another still resolves to itself.
 *
 * USAGE:
 * ownerIndexFilePackageTransformer({ ownerIndex, filePath: '/repo/packages/a/src/x/x-broker.ts' });
 * // Returns '@repo/a', or undefined when no indexed package holds the file
 */
import type { OwnerIndex, PackageName } from '@dungeonmaster/shared/contracts';

export const ownerIndexFilePackageTransformer = ({
  ownerIndex,
  filePath,
}: {
  ownerIndex: OwnerIndex;
  filePath: string;
}): PackageName | undefined =>
  ownerIndex.packages
    .filter(({ dir }) => filePath.startsWith(`${dir}/`))
    .sort((left, right) => right.dir.length - left.dir.length)[0]?.name;
