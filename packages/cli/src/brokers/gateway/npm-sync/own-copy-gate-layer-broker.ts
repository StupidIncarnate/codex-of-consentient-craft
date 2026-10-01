/**
 * PURPOSE: Decides whether dungeonmaster's own folders for one dependency may be copied, once
 * `ownCopyPlanLayerBroker` found some. Our wrappers are built against OUR versions, so first the
 * version the consumer has installed (`installedVersionLayerBroker`, from the npm gateway package)
 * must satisfy the range `@dungeonmaster/npm`'s own package.json declares for that package in
 * `dependencies` or `peerDependencies` — a subpath folder gates on the package it wraps, which is
 * this dependency; nothing installed, or no range of ours, fails the same way. Then a plan that
 * already failed to resolve passes its reason on. Last, the files that touch the package's API — the
 * barrel, wrapper files and `.stub.ts` files — are compiled where they will land
 * (`copyCompileLayerBroker`), beside every file this run plans to write before them, and any
 * diagnostic fails, carrying the first one as the skip's `detail`. `.test.ts` and `.proxy.ts` files
 * are never root files: they need jest's types, which `init` declares but has not installed when
 * its own sync runs, and a folder refused then stays a passthrough for good, since no later sync
 * replaces an existing folder. A real version mismatch surfaces in a wrapper or a stub; whatever
 * those import is still checked as usual. Null means copy; anything else is the skip to report, and
 * the sync writes a passthrough instead. Nothing is written here, so a failed gate leaves nothing behind.
 *
 * USAGE:
 * await ownCopyGateLayerBroker({ repoRoot, ownSrcRoot, ownPackageJson, dependency, copyPlan: ['zod'], plannedCopies: [], plannedFiles: [] });
 * // Returns null, or { name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' }
 */

import type { PackageJson } from '@dungeonmaster/shared/contracts';
import { readFile } from '#gateway/node/fs__promises';
import { join, relative } from '#gateway/node/path';
import { satisfies } from '#gateway/npm/semver';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import type { GatewayNpmSkipReason } from '../../../contracts/gateway-npm-skip-reason/gateway-npm-skip-reason-contract';
import {
  gatewayNpmSkippedOwnCopyContract,
  type GatewayNpmSkippedOwnCopy,
} from '../../../contracts/gateway-npm-skipped-own-copy/gateway-npm-skipped-own-copy-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { copyCompileLayerBroker } from './copy-compile-layer-broker';
import { installedVersionLayerBroker } from './installed-version-layer-broker';
import { sourceFilesListLayerBroker } from './source-files-list-layer-broker';

export const ownCopyGateLayerBroker = async ({
  repoRoot,
  ownSrcRoot,
  ownPackageJson,
  dependency,
  copyPlan,
  plannedCopies,
  plannedFiles,
}: {
  repoRoot: string;
  ownSrcRoot: string;
  ownPackageJson: PackageJson | null;
  dependency: GatewayNpmDependency;
  copyPlan: readonly string[] | GatewayNpmSkipReason;
  plannedCopies: readonly (readonly [string, string])[];
  plannedFiles: readonly (readonly [string, string])[];
}): Promise<GatewayNpmSkippedOwnCopy | null> => {
  const { consumerGateway, sourceExtensions, compileGateSkippedSuffixes, skipDetailMaxLength } =
    gatewayNpmSyncStatics;
  const npmPackageRoot = join(repoRoot, consumerGateway.packageDirectory);
  const srcRoot = join(npmPackageRoot, consumerGateway.sourceDirectory);

  const ours =
    ownPackageJson?.dependencies?.[dependency.name] ??
    ownPackageJson?.peerDependencies?.[dependency.name];
  const installed = await installedVersionLayerBroker({
    repoRoot,
    fromDirectory: npmPackageRoot,
    packageName: dependency.name,
  });
  const versions = {
    ...(installed === null ? {} : { installed }),
    ...(ours === undefined ? {} : { ours }),
  };

  if (installed === null || ours === undefined || !satisfies(installed, ours)) {
    return gatewayNpmSkippedOwnCopyContract.parse({
      name: dependency.name,
      reason: 'version',
      ...versions,
    });
  }

  if (typeof copyPlan === 'string') {
    return gatewayNpmSkippedOwnCopyContract.parse({
      name: dependency.name,
      reason: copyPlan,
      ...versions,
    });
  }

  const thisCopy = copyPlan.map(
    (folder) => [join(ownSrcRoot, folder), join(srcRoot, folder)] as const,
  );
  const copiedFiles = await Promise.all(
    [...plannedCopies, ...thisCopy].map(async ([ownFolder, consumerFolder]) => {
      const ownFiles = await sourceFilesListLayerBroker({ dirPath: ownFolder });
      return Promise.all(
        ownFiles.map(
          async (ownFile) =>
            [join(consumerFolder, relative(ownFolder, ownFile)), await readFile(ownFile)] as const,
        ),
      );
    }),
  );
  const files = new Map<string, string>([...plannedFiles, ...copiedFiles.flat()]);
  const thisCopyFolders = thisCopy.map(([, consumerFolder]) => consumerFolder);
  const checkedPaths = [...files.keys()]
    .filter(
      (filePath) =>
        sourceExtensions.some((extension) => filePath.endsWith(extension)) &&
        !compileGateSkippedSuffixes.some((suffix) => filePath.endsWith(suffix)) &&
        thisCopyFolders.some((consumerFolder) => filePath.startsWith(`${consumerFolder}/`)),
    )
    .sort();

  const [firstDiagnostic] = copyCompileLayerBroker({ repoRoot, ownSrcRoot, files, checkedPaths });
  if (firstDiagnostic !== undefined) {
    return gatewayNpmSkippedOwnCopyContract.parse({
      name: dependency.name,
      reason: 'compile',
      ...versions,
      detail: firstDiagnostic.slice(0, skipDetailMaxLength),
    });
  }

  return null;
};
