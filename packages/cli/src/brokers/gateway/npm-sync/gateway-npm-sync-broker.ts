/**
 * PURPOSE: Gives every third-party package a consumer lists in `dependencies` a folder under
 * `packages/@gateway/npm/src/`, so `#gateway/npm/<name>` resolves the moment the package is
 * installed. A package counts as covered — and gets nothing — when the consumer already has its
 * folder or any `<folder>__*` subpath folder wrapping that same package (`react-dom__client` covers
 * `react-dom`). Otherwise the folders dungeonmaster's own npm gateway has for it (its own, its
 * subpaths, or only its subpaths) are copied from the installed `@dungeonmaster/npm` only when what
 * they import resolves in the consumer, the installed version satisfies the range
 * `@dungeonmaster/npm` declares for the package, and the folders compile where they will land
 * (`ownCopyGateLayerBroker`); anything else gets a generated passthrough barrel and test, and a
 * failed gate is reported in `skippedOwnCopy`. A folder already present is never touched. Each
 * package a folder was written for is added to the npm gateway's own `dependencies`, the
 * placeholder `src/index.d.ts` goes once a subpath exists, and when `dependencies` changed one
 * `npm install --ignore-scripts` from the repo root brings the lockfile back in step — best effort:
 * the folders are written by then, so a failing install (a bad specifier elsewhere in the repo)
 * becomes the report's `lockfileWarning`, not an error. Under `npm ci` (`npm_command=ci`) it writes
 * nothing and only reports what it would do: CI must see only a sync someone already committed. A
 * repo with no `packages/@gateway/npm/package.json` has no gateway to fill yet, and gets an empty
 * report.
 *
 * USAGE:
 * await gatewayNpmSyncBroker({ repoRoot: '/repo' });
 * // Returns { copied: ['elkjs'], generated: ['left-pad', 'zod'], untyped: ['left-pad'], esmOnly: [], skippedOwnCopy: [{ name: 'zod', reason: 'version', installed: '3.23.8', ours: '^4.6.5' }] }
 */

import { run } from '#gateway/node/child_process';
import {
  cp,
  pathExists,
  readdirEntries,
  readJsonFileIfExists,
  unlinkIfExists,
  writeFileCreatingParent,
} from '#gateway/node/fs__promises';
import { resolvePackageRoot } from '#gateway/node/module';
import { join } from '#gateway/node/path';
import { getEnv } from '#gateway/node/process';
import { packageJsonContract } from '@dungeonmaster/shared/contracts';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import {
  gatewayNpmSyncReportContract,
  type GatewayNpmSyncReport,
} from '../../../contracts/gateway-npm-sync-report/gateway-npm-sync-report-contract';
import type { GatewayNpmSkippedOwnCopy } from '../../../contracts/gateway-npm-skipped-own-copy/gateway-npm-skipped-own-copy-contract';
import type { ScaffoldFile } from '../../../contracts/scaffold-file/scaffold-file-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { gatewayPackageTemplateStatics } from '../../../statics/gateway-package-template/gateway-package-template-statics';
import { gatewayNpmPassthroughFilesTransformer } from '../../../transformers/gateway-npm-passthrough-files/gateway-npm-passthrough-files-transformer';
import { npmModuleExportShapeBroker } from '../../npm-module/export-shape/npm-module-export-shape-broker';
import { gatewayNpmDependenciesListBroker } from '../npm-dependencies-list/gateway-npm-dependencies-list-broker';
import { gatewayPackageRecordLayerBroker } from './gateway-package-record-layer-broker';
import { ownCopyGateLayerBroker } from './own-copy-gate-layer-broker';
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
      skippedOwnCopy: [],
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
  const ownManifest =
    ownPackageRoot === null
      ? null
      : await readJsonFileIfExists(join(ownPackageRoot, packageJson.fileName));
  const ownPackageJson = ownManifest === null ? null : packageJsonContract.parse(ownManifest);

  const resolvableNames = dependencies.map(({ name }) => name);
  const dependencyFolders = dependencies.map(({ folder }) => folder);
  const claimed = new Set<string>(consumerFolders);
  const copied: string[] = [];
  const copies: (readonly [string, string])[] = [];
  const passthroughs: { dependency: GatewayNpmDependency; files: readonly ScaffoldFile[] }[] = [];
  const untyped: GatewayNpmDependency['name'][] = [];
  const esmOnly: GatewayNpmDependency['name'][] = [];
  const skippedOwnCopy: GatewayNpmSkippedOwnCopy[] = [];
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
      const skipped = await ownCopyGateLayerBroker({
        repoRoot,
        ownSrcRoot,
        ownPackageJson,
        dependency,
        copyPlan,
        plannedCopies: copies,
        plannedFiles: passthroughs.flatMap(({ files }) =>
          files.map((file) => [join(srcRoot, file.relativePath), file.contents] as const),
        ),
      });
      if (skipped === null && typeof copyPlan !== 'string') {
        for (const folder of copyPlan) {
          claimed.add(folder);
          copied.push(folder);
          copies.push([join(ownSrcRoot, folder), join(srcRoot, folder)]);
        }
        return;
      }
      if (skipped !== null) {
        skippedOwnCopy.push(skipped);
      }
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
    skippedOwnCopy,
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

  if (!recordChanged) {
    return report;
  }

  const install = await run({
    command: lockfileInstall.command,
    args: [...lockfileInstall.args],
    cwd: repoRoot,
  });
  if (install.exitCode === 0) {
    return report;
  }

  const outputLines = install.output.split('\n').map((line) => line.trim());
  const reason =
    outputLines.find((line) =>
      lockfileInstall.errorLinePrefixes.some((prefix) => line.startsWith(prefix)),
    ) ??
    outputLines.find((line) => line.length > 0) ??
    'no output';
  return gatewayNpmSyncReportContract.parse({
    ...report,
    lockfileWarning: `lockfile not updated: \`${lockfileInstall.command} ${lockfileInstall.args.join(' ')}\` exited ${String(install.exitCode)} (${reason}); run npm install yourself to update package-lock.json`,
  });
};
