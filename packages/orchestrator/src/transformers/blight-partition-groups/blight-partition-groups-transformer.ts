/**
 * PURPOSE: Cuts a blight checklist into the dispatch groups one `blightwarden-group-minion` each
 * takes, package first and size second. Reach for this over reading `item.packageName` directly
 * whenever a caller needs the GROUPS rather than the key they are cut on — the render, and any
 * consumer that has to state how many minions a package's files become.
 *
 * USAGE:
 * blightPartitionGroupsTransformer({ items: checklist.items });
 * // Returns one entry per group, in the order the items arrived
 *
 * PACKAGE FIRST is what makes disjointness a property instead of an instruction. Two minions
 * collide only by sharing a file, and a file belongs to exactly one package, so groups cut on the
 * package boundary can never overlap however the sizes fall. Cutting on size alone leaves that
 * guarantee resting on whoever drew the boundary, which is the shape that puts two minions on one
 * file and produces typecheck failures read as a stale `dist`.
 *
 * SIZE IS THE SECONDARY CUT, applied only inside a package: `blightPartitionStatics` bounds what a
 * single minion can read carefully, so a package with more changed files than that becomes several
 * groups rather than one unreviewable one. The reverse never happens — two small packages stay two
 * groups rather than being packed together to reach the target.
 *
 * FILES UNDER NO DECLARED PACKAGE get their own trailing groups, cut to the same size, because
 * every unit needs an owner and no other group can take them without spanning a boundary. They run
 * last so the packages a quest actually declared lead the dispatch.
 *
 * An impl path is emitted once, under the first item that carries it, so the four concern crossings
 * of one file cannot spread that file across four groups.
 */

import type {
  BlightChecklistItem,
  PackageName,
  RepoRelativePath,
} from '@dungeonmaster/shared/contracts';

import { blightPartitionStatics } from '../../statics/blight-partition/blight-partition-statics';

// Wrapped in Readonly<> (rather than a bare object literal) so consistent-type-definitions does
// not autofix this into an interface, which ban-adhoc-types then bans in transformers/ files.
export type BlightPartitionGroup = Readonly<{
  packageName: PackageName | undefined;
  implPaths: RepoRelativePath[];
}>;

export const blightPartitionGroupsTransformer = ({
  items,
}: {
  items: readonly BlightChecklistItem[];
}): BlightPartitionGroup[] => {
  // Keyed on the PackageName itself — `undefined` is a legitimate Map key, so the files under no
  // declared package need no sentinel that a real package name could ever collide with.
  const buckets = new Map<PackageName | undefined, RepoRelativePath[]>();
  const seenImplPaths = new Set<RepoRelativePath>();

  for (const item of items) {
    if (seenImplPaths.has(item.implPath)) {
      continue;
    }
    seenImplPaths.add(item.implPath);

    const bucket = buckets.get(item.packageName) ?? [];
    bucket.push(item.implPath);
    buckets.set(item.packageName, bucket);
  }

  const orderedBuckets = [
    ...[...buckets.entries()].filter(([packageName]) => packageName !== undefined),
    ...[...buckets.entries()].filter(([packageName]) => packageName === undefined),
  ];

  const groups: BlightPartitionGroup[] = [];
  for (const [packageName, implPaths] of orderedBuckets) {
    for (
      let start = 0;
      start < implPaths.length;
      start += blightPartitionStatics.targetFilesPerGroup
    ) {
      groups.push({
        packageName,
        implPaths: implPaths.slice(start, start + blightPartitionStatics.targetFilesPerGroup),
      });
    }
  }

  return groups;
};
