/**
 * PURPOSE: Decides which folders of dungeonmaster's own npm gateway to copy for one consumer
 * dependency — its own folder when we have one, every `<folder>__*` subpath folder that wraps a
 * subpath of the SAME package (`subpathFoldersOwnedLayerBroker`), and `gateway-test-support` when a
 * copied file needs it. A subpath folder the consumer already has, or one whose imports would not
 * resolve, is left out. When we have the package's own folder and it does not resolve, nothing is
 * copied. When we have only subpath folders for it (`modelcontextprotocol__sdk__server` and no
 * `modelcontextprotocol__sdk`), those that resolve are copied on their own. Null — nothing of ours
 * to copy — sends the sync to a passthrough.
 *
 * USAGE:
 * await ownCopyPlanLayerBroker({ repoRoot, ownSrcRoot, dependency, resolvableNames, knownFolders, consumerFolders });
 * // Returns ['hono', 'hono__utils__http-status', 'hono__ws'], or null when there is nothing of ours to copy
 */

import { readdirEntries } from '#gateway/node/fs__promises';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { folderRequirementsLayerBroker } from './folder-requirements-layer-broker';
import { subpathFoldersOwnedLayerBroker } from './subpath-folders-owned-layer-broker';

export const ownCopyPlanLayerBroker = async ({
  repoRoot,
  ownSrcRoot,
  dependency,
  resolvableNames,
  knownFolders,
  consumerFolders,
}: {
  repoRoot: string;
  ownSrcRoot: string;
  dependency: GatewayNpmDependency;
  resolvableNames: readonly string[];
  knownFolders: readonly string[];
  consumerFolders: readonly string[];
}): Promise<readonly string[] | null> => {
  const { testSupport } = gatewayNpmSyncStatics.folders;
  const ownFolders = (await readdirEntries(ownSrcRoot))
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => entry.name)
    .sort();

  const hasRootFolder = ownFolders.some((ownFolder) => ownFolder === dependency.folder);
  const ownedSubpaths = await subpathFoldersOwnedLayerBroker({
    srcRoot: ownSrcRoot,
    dependency,
    candidateFolders: ownFolders.filter(
      (ownFolder) => !consumerFolders.some((consumerFolder) => consumerFolder === ownFolder),
    ),
  });

  const copySet = hasRootFolder ? [dependency.folder, ...ownedSubpaths] : ownedSubpaths;
  const copyKnownFolders = [...knownFolders, ...copySet];
  const requirements = await Promise.all(
    copySet.map(async (folder) => ({
      folder,
      extras: await folderRequirementsLayerBroker({
        repoRoot,
        ownSrcRoot,
        folder,
        resolvableNames,
        knownFolders: copyKnownFolders,
      }),
    })),
  );

  const resolving = requirements.flatMap(({ folder, extras }) =>
    extras === null ? [] : [{ folder, extras }],
  );
  const rootUnresolved =
    hasRootFolder && !resolving.some(({ folder }) => folder === dependency.folder);
  if (rootUnresolved || resolving.length === 0) {
    return null;
  }

  const copyFolders = resolving.map(({ folder }) => folder);
  const needsTestSupport = resolving.some(({ extras }) =>
    extras.some((extra) => extra === testSupport),
  );
  const testSupportAbsent = !consumerFolders.some(
    (consumerFolder) => consumerFolder === testSupport,
  );

  if (!needsTestSupport || !testSupportAbsent) {
    return copyFolders;
  }

  const testSupportExtras = await folderRequirementsLayerBroker({
    repoRoot,
    ownSrcRoot,
    folder: testSupport,
    resolvableNames,
    knownFolders: copyKnownFolders,
  });
  return testSupportExtras === null ? null : [...copyFolders, testSupport];
};
