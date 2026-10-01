/**
 * PURPOSE: What passthrough the sync writes for a dependency it is not copying our wrapper for. The
 * usual answer is one barrel at the dependency's own folder re-exporting the package root — also
 * when the package is not installed yet, since nothing can be checked then. An installed package
 * whose root does not resolve (`specifierResolvesLayerBroker`: no `.` export, no `main`) gets no root
 * barrel, which the consumer's build would refuse with TS2307; it gets one barrel per subpath folder
 * dungeonmaster's own gateway has for it (same folder name, the specifier our own barrel imports)
 * whose specifier the consumer's install resolves, each shaped like any passthrough. An
 * `export-equals` plan also carries the names its barrel re-exports one by one. An empty
 * answer means nothing resolves and nothing is written — the sync reports the package as having no
 * root export, to be wrapped by hand.
 *
 * USAGE:
 * await passthroughPlanLayerBroker({ repoRoot: '/repo', ownSrcRoot, dependency, excludedFolders: [] });
 * // Returns [{ dependency: { name: '@modelcontextprotocol/sdk/server/mcp.js', range: '^1.0.0', folder: 'modelcontextprotocol__sdk__server__mcp' }, shape: 'named' }]
 */

import * as ts from '#gateway/npm/typescript';
import { readdirEntries, readFile } from '#gateway/node/fs__promises';
import { createRequire } from '#gateway/node/module';
import { join, sep } from '#gateway/node/path';
import {
  gatewayNpmDependencyContract,
  type GatewayNpmDependency,
} from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import {
  gatewayNpmPassthroughPlanContract,
  type GatewayNpmPassthroughPlan,
} from '../../../contracts/gateway-npm-passthrough-plan/gateway-npm-passthrough-plan-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { npmPackageNameFromSpecifierTransformer } from '../../../transformers/npm-package-name-from-specifier/npm-package-name-from-specifier-transformer';
import { sourceImportSpecifiersTransformer } from '../../../transformers/source-import-specifiers/source-import-specifiers-transformer';
import { npmModuleExportNamesBroker } from '../../npm-module/export-names/npm-module-export-names-broker';
import { npmModuleExportShapeBroker } from '../../npm-module/export-shape/npm-module-export-shape-broker';
import { specifierResolvesLayerBroker } from './specifier-resolves-layer-broker';
import { subpathFoldersOwnedLayerBroker } from './subpath-folders-owned-layer-broker';

const BARREL_EXTENSION = '.ts';
const EXPORT_EQUALS_SHAPE = 'export-equals';

export const passthroughPlanLayerBroker = async ({
  repoRoot,
  ownSrcRoot,
  dependency,
  excludedFolders,
}: {
  repoRoot: string;
  ownSrcRoot: string | null;
  dependency: GatewayNpmDependency;
  excludedFolders: readonly string[];
}): Promise<readonly GatewayNpmPassthroughPlan[]> => {
  const { consumerGateway, packageJson } = gatewayNpmSyncStatics;
  const npmPackageRoot = join(repoRoot, consumerGateway.packageDirectory);

  const installed = (
    createRequire(join(npmPackageRoot, packageJson.fileName)).resolve.paths(dependency.name) ?? []
  )
    .filter((directory) => directory.startsWith(`${repoRoot}${sep}`))
    .some((directory) => ts.sys.fileExists(join(directory, dependency.name, packageJson.fileName)));

  if (!installed || specifierResolvesLayerBroker({ repoRoot, specifier: dependency.name })) {
    const shape = npmModuleExportShapeBroker({ repoRoot, packageName: dependency.name });
    return [
      gatewayNpmPassthroughPlanContract.parse({
        dependency,
        shape,
        ...(shape === EXPORT_EQUALS_SHAPE
          ? { exportNames: npmModuleExportNamesBroker({ repoRoot, packageName: dependency.name }) }
          : {}),
      }),
    ];
  }

  if (ownSrcRoot === null) {
    return [];
  }

  const ownFolders = (await readdirEntries(ownSrcRoot))
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => entry.name)
    .filter((folder) => !excludedFolders.some((excluded) => excluded === folder))
    .sort();
  const subpathFolders = await subpathFoldersOwnedLayerBroker({
    srcRoot: ownSrcRoot,
    dependency,
    candidateFolders: ownFolders,
  });

  const plans = await Promise.all(
    subpathFolders.map(async (folder) => {
      const barrel = await readFile(join(ownSrcRoot, folder, `${folder}${BARREL_EXTENSION}`));
      const specifier = sourceImportSpecifiersTransformer({ sourceText: barrel }).find(
        (imported) =>
          imported !== dependency.name &&
          npmPackageNameFromSpecifierTransformer({ specifier: imported }) === dependency.name,
      );
      if (specifier === undefined || !specifierResolvesLayerBroker({ repoRoot, specifier })) {
        return [];
      }
      const subpathName = gatewayNpmDependencyContract.shape.name.parse(specifier);
      const shape = npmModuleExportShapeBroker({ repoRoot, packageName: subpathName });
      return [
        gatewayNpmPassthroughPlanContract.parse({
          dependency: { name: subpathName, range: dependency.range, folder },
          shape,
          ...(shape === EXPORT_EQUALS_SHAPE
            ? { exportNames: npmModuleExportNamesBroker({ repoRoot, packageName: subpathName }) }
            : {}),
        }),
      ];
    }),
  );

  return plans.flat();
};
