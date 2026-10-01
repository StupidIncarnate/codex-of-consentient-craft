/**
 * PURPOSE: Gives every third-party package a consumer lists in `dependencies` a folder under
 * `packages/@gateway/npm/src/`, so `#gateway/npm/<name>` resolves the moment the package is
 * installed. A package counts as covered — and gets nothing — when the consumer already has its
 * folder or any `<folder>__*` subpath folder wrapping that same package (`react-dom__client` covers
 * `react-dom`). Otherwise the folders dungeonmaster's own npm gateway has for it (its own, its
 * subpaths, or only its subpaths) are copied from the installed `@dungeonmaster/npm` when what they
 * import resolves in the consumer; anything else gets a generated passthrough barrel and test. A
 * folder already present is never touched. Each package a
 * folder was written for is added to the npm gateway's own `dependencies`, the placeholder
 * `src/index.d.ts` goes once a subpath exists, and when `dependencies` changed one
 * `npm install --ignore-scripts` from the repo root brings the lockfile back in step. Under `npm ci`
 * (`npm_command=ci`) it writes nothing and only reports what it would do: CI must see only a sync
 * someone already committed. A repo with no `packages/@gateway/npm/package.json` has no gateway to
 * fill yet, and gets an empty report.
 *
 * USAGE:
 * await gatewayNpmSyncBroker({ repoRoot: '/repo' });
 * // Returns { copied: ['zod'], generated: ['left-pad', 'ink'], untyped: ['left-pad'], esmOnly: ['ink'] }
 */

import { run } from '#gateway/node/child_process';
import {
  cp,
  pathExists,
  readdirEntries,
  unlinkIfExists,
  writeFileCreatingParent,
} from '#gateway/node/fs__promises';
import { resolvePackageRoot } from '#gateway/node/module';
import { join } from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import {
  gatewayNpmSyncReportContract,
  type GatewayNpmSyncReport,
} from '../../../contracts/gateway-npm-sync-report/gateway-npm-sync-report-contract';
import type { ScaffoldFile } from '../../../contracts/scaffold-file/scaffold-file-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { gatewayPackageTemplateStatics } from '../../../statics/gateway-package-template/gateway-package-template-statics';
import { gatewayNpmPassthroughFilesTransformer } from '../../../transformers/gateway-npm-passthrough-files/gateway-npm-passthrough-files-transformer';
import { npmModuleExportShapeBroker } from '../../npm-module/export-shape/npm-module-export-shape-broker';
import { gatewayNpmDependenciesListBroker } from '../npm-dependencies-list/gateway-npm-dependencies-list-broker';
import { gatewayPackageRecordLayerBroker } from './gateway-package-record-layer-broker';
import { ownCopyPlanLayerBroker } from './own-copy-plan-layer-broker';
import { subpathFoldersOwnedLayerBroker } from './subpath-folders-owned-layer-broker';

export const gatewayNpmSyncBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<GatewayNpmSyncReport> => {
  const { consumerGateway, ownGateway, packageJson, lifecycle, lockfileInstall } =
    gatewayNpmSyncStatics;
  const npmPackageRoot = join(repoRoot, consumerGateway.packageDirectory);
  const srcRoot = join(npmPackageRoot, consumerGateway.sourceDirectory);

  if (!(await pathExists(join(npmPackageRoot, packageJson.fileName)))) {
    return gatewayNpmSyncReportContract.parse({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
    });
  }

  const dependencies = await gatewayNpmDependenciesListBroker({ repoRoot });
  const consumerFolders = (await pathExists(srcRoot))
    ? (await readdirEntries(srcRoot))
        .filter((entry) => entry.kind === 'directory')
        .map((entry) => entry.name)
    : [];
  const ownPackageRoot = resolvePackageRoot({ specifier: ownGateway.specifier });
  const ownSrcRoot =
    ownPackageRoot === null ? null : join(ownPackageRoot, ownGateway.sourceDirectory);

  const resolvableNames = dependencies.map(({ name }) => name);
  const dependencyFolders = dependencies.map(({ folder }) => folder);
  const claimed = new Set<string>(consumerFolders);
  const copied: string[] = [];
  const copies: [string, string][] = [];
  const passthroughs: { dependency: GatewayNpmDependency; files: readonly ScaffoldFile[] }[] = [];
  const untyped: GatewayNpmDependency['name'][] = [];
  const esmOnly: GatewayNpmDependency['name'][] = [];
  const written: GatewayNpmDependency[] = [];

  // Sequential: a copy set claims folders (a subpath, gateway-test-support) the next dependency's
  // plan must see as taken, never as free to copy a second time.
  await dependencies.reduce(async (previous, dependency) => {
    await previous;
    if (claimed.has(dependency.folder)) {
      return;
    }
    const coveringSubpaths = await subpathFoldersOwnedLayerBroker({
      srcRoot,
      dependency,
      candidateFolders: consumerFolders,
    });
    if (coveringSubpaths.length > 0) {
      return;
    }

    written.push(dependency);
    const copyPlan =
      ownSrcRoot === null
        ? null
        : await ownCopyPlanLayerBroker({
            repoRoot,
            ownSrcRoot,
            dependency,
            resolvableNames,
            knownFolders: [...claimed, ...dependencyFolders],
            consumerFolders: [...claimed],
          });

    if (ownSrcRoot !== null && copyPlan !== null) {
      for (const folder of copyPlan) {
        claimed.add(folder);
        copied.push(folder);
        copies.push([join(ownSrcRoot, folder), join(srcRoot, folder)]);
      }
      return;
    }

    const shape = npmModuleExportShapeBroker({ repoRoot, packageName: dependency.name });
    claimed.add(dependency.folder);
    passthroughs.push({
      dependency,
      files: gatewayNpmPassthroughFilesTransformer({ dependency, shape }),
    });
    if (shape === 'untyped') {
      untyped.push(dependency.name);
    }
    if (shape === 'esm-only') {
      esmOnly.push(dependency.name);
    }
  }, Promise.resolve());

  const report = gatewayNpmSyncReportContract.parse({
    copied,
    generated: passthroughs.map(({ dependency }) => dependency.folder),
    untyped,
    esmOnly,
  });

  if (getEnv(lifecycle.envName) === lifecycle.ciValue) {
    return report;
  }

  await Promise.all([
    ...copies.map(async ([source, destination]) => cp(source, destination, { recursive: true })),
    ...passthroughs.flatMap(({ files }) =>
      files.map(async (file) =>
        writeFileCreatingParent(join(srcRoot, file.relativePath), file.contents),
      ),
    ),
  ]);

  if (claimed.size > 0) {
    await unlinkIfExists(join(npmPackageRoot, gatewayPackageTemplateStatics.placeholderPath));
  }

  const recordChanged = await gatewayPackageRecordLayerBroker({
    npmPackageRoot,
    dependencies: written,
  });

  if (recordChanged) {
    const install = await run({
      command: lockfileInstall.command,
      args: [...lockfileInstall.args],
      cwd: repoRoot,
    });
    if (install.exitCode !== 0) {
      throw new Error(
        `gateway npm sync: \`${lockfileInstall.command} ${lockfileInstall.args.join(' ')}\` in ${repoRoot} exited ${String(install.exitCode)}:\n${install.output}`,
      );
    }
  }

  return report;
};
