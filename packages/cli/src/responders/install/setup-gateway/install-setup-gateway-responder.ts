/**
 * PURPOSE: `dungeonmaster init`'s gateway step — scaffolds the four `packages/@gateway/{npm,node,
 * browser,bin}` workspace packages a fresh consumer repo is missing (node and browser filled with
 * dungeonmaster's own source, npm and bin empty), links them into root `workspaces`, adds the
 * four-entry `#gateway/*` `imports` map to every EXISTING workspace package, sets the root
 * tsconfig.json to node16 resolution with the `source` condition, and gives every existing
 * package's tsconfig.build.json the `gateway-dist` condition. Every step is independently
 * idempotent — a second run changes nothing further.
 *
 * USAGE:
 * const result = await InstallSetupGatewayResponder({ context });
 * // Scaffolds the gateway, wires every existing package into it, or reports what was already done
 */

import { type InstallContext, type InstallResult, installMessageContract, installResultContract } from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { basename, join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  jsonFileContentsTransformer,
  workspaceScopeFromRootNameTransformer,
} from '@dungeonmaster/shared/transformers';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { tsconfigCompilerOptionsContract } from '../../../contracts/tsconfig-compiler-options/tsconfig-compiler-options-contract';
import { packageScaffoldWriteBroker } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker';
import { gatewayExistingPackagesListBroker } from '../../../brokers/gateway/existing-packages-list/gateway-existing-packages-list-broker';
import { gatewayTsconfigCompilerOptionsWriteBroker } from '../../../brokers/gateway/tsconfig-compiler-options-write/gateway-tsconfig-compiler-options-write-broker';
import { gatewaySourceCopyBroker } from '../../../brokers/gateway/source-copy/gateway-source-copy-broker';
import { gatewayWorkspacesMergeTransformer } from '../../../transformers/gateway-workspaces-merge/gateway-workspaces-merge-transformer';
import { gatewayImportsMergeTransformer } from '../../../transformers/gateway-imports-merge/gateway-imports-merge-transformer';
import { gatewayPackageScaffoldFilesTransformer } from '../../../transformers/gateway-package-scaffold-files/gateway-package-scaffold-files-transformer';
import { gatewayFoldersStatics } from '../../../statics/gateway-folders/gateway-folders-statics';
import { gatewayPackageTemplateStatics } from '../../../statics/gateway-package-template/gateway-package-template-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const TSCONFIG_BUILD_FILENAME = 'tsconfig.build.json';

export const InstallSetupGatewayResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const rootPackageJsonPath = join(context.targetProjectRoot, 'package.json');

  if (!existsSync(rootPackageJsonPath)) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('No package.json found'),
    });
  }

  const rawRootPackageJson = await readFile(rootPackageJsonPath);
  const rootPackageJson = packageJsonRawContract.parse(JSON.parse(rawRootPackageJson));
  const nameKey = packageJsonRawContract.keyType.parse('name');
  const rootNameValue = rootPackageJson[nameKey];
  const rootPackageJsonName = typeof rootNameValue === 'string' ? rootNameValue : undefined;
  const fallbackName = basename(context.targetProjectRoot);
  const scope = workspaceScopeFromRootNameTransformer({ rootPackageJsonName, fallbackName });
  if (scope === undefined) {
    throw new Error(
      `Could not derive a workspace scope for ${context.targetProjectRoot}: no root package.json name and no fallback directory name`,
    );
  }

  const updatedRootPackageJson = gatewayWorkspacesMergeTransformer({ rootPackageJson });
  const workspacesChanged = updatedRootPackageJson !== rootPackageJson;
  if (workspacesChanged) {
    await writeFile(
      rootPackageJsonPath,
      jsonFileContentsTransformer({ value: updatedRootPackageJson }),
    );
  }

  const packagesDir = join(context.targetProjectRoot, 'packages');
  const gatewayDir = join(packagesDir, '@gateway');

  const scaffoldOutcomes = await Promise.all(
    gatewayFoldersStatics.folders.map(async (folder) => {
      const packageRoot = join(gatewayDir, folder);
      if (existsSync(packageRoot)) {
        return null;
      }
      const files = gatewayPackageScaffoldFilesTransformer({ scope, folder });
      await packageScaffoldWriteBroker({ packageRoot, files });
      if (folder === 'node' || folder === 'browser') {
        await gatewaySourceCopyBroker({ folder, packageRoot });
      }
      return folder;
    }),
  );
  const createdFolders = scaffoldOutcomes.filter((folder) => folder !== null);

  const rootTsconfigPath = join(context.targetProjectRoot, locationsStatics.repoRoot.tsconfig);
  const rootTsconfigExists = existsSync(rootTsconfigPath);
  const rootTsconfigChanged = await gatewayTsconfigCompilerOptionsWriteBroker({
    tsconfigPath: rootTsconfigPath,
    options: tsconfigCompilerOptionsContract.parse(
      gatewayPackageTemplateStatics.rootCompilerOptions,
    ),
  });

  const existingPackageDirs = gatewayExistingPackagesListBroker({ packagesDir });

  const perPackageOutcomes = await Promise.all(
    existingPackageDirs.map(async (packageDir) => {
      const pkgPackageJsonPath = join(packageDir, 'package.json');
      const rawPkgPackageJson = await readFile(pkgPackageJsonPath);
      const pkgPackageJson = packageJsonRawContract.parse(JSON.parse(rawPkgPackageJson));
      const importsKey = packageJsonRawContract.keyType.parse('imports');
      const existingImports = pkgPackageJson[importsKey];
      const mergedImports = gatewayImportsMergeTransformer({ existingImports, scope });
      const importsChanged = mergedImports !== existingImports;

      if (importsChanged) {
        await writeFile(
          pkgPackageJsonPath,
          jsonFileContentsTransformer({
            value: { ...pkgPackageJson, [importsKey]: mergedImports },
          }),
        );
      }

      const pkgTsconfigBuildChanged = await gatewayTsconfigCompilerOptionsWriteBroker({
        tsconfigPath: join(packageDir, TSCONFIG_BUILD_FILENAME),
        options: tsconfigCompilerOptionsContract.parse({
          customConditions: gatewayPackageTemplateStatics.buildCustomConditions,
        }),
      });

      return { importsChanged, pkgTsconfigBuildChanged };
    }),
  );

  const updatedImportsCount = perPackageOutcomes.filter((outcome) => outcome.importsChanged).length;
  const updatedBuildTsconfigCount = perPackageOutcomes.filter(
    (outcome) => outcome.pkgTsconfigBuildChanged,
  ).length;

  const anyChange =
    workspacesChanged ||
    createdFolders.length > 0 ||
    rootTsconfigChanged ||
    updatedImportsCount > 0 ||
    updatedBuildTsconfigCount > 0;

  const messageParts = [
    workspacesChanged
      ? 'added packages/@gateway/* to workspaces'
      : 'workspaces already includes packages/@gateway/*',
    createdFolders.length > 0
      ? `scaffolded gateway packages: ${createdFolders.join(', ')}`
      : 'gateway packages already scaffolded',
    rootTsconfigExists
      ? rootTsconfigChanged
        ? 'set node16 resolution in tsconfig.json'
        : 'tsconfig.json already resolves node16'
      : 'no tsconfig.json found to set node16 resolution in',
    `updated imports in ${String(updatedImportsCount)} existing package(s)`,
    `set gateway-dist in tsconfig.build.json of ${String(updatedBuildTsconfigCount)} existing package(s)`,
  ];

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: anyChange ? 'created' : 'skipped',
    message: installMessageContract.parse(messageParts.join('; ')),
  });
};
