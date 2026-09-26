/**
 * PURPOSE: `dungeonmaster init`'s gateway step — scaffolds the four `packages/@gateway/{npm,node,
 * browser,bin}` workspace packages a fresh consumer repo is missing, links them into root
 * `workspaces`, adds the four-entry `#gateway/*` `imports` map to every EXISTING workspace package,
 * and merges the matching `compilerOptions.paths` into the root tsconfig.json plus any existing
 * package's own tsconfig.json (only when it already overrides `paths`) and tsconfig.build.json (when
 * one exists). Every step is independently idempotent — a second run changes nothing further.
 *
 * USAGE:
 * const result = await InstallSetupGatewayResponder({ context });
 * // Scaffolds the gateway, wires every existing package into it, or reports what was already done
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import {
  pathJoinAdapter,
  fsExistsSyncAdapter,
  pathBasenameAdapter,
} from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { pathRelativeAdapter } from '../../../adapters/path/relative/path-relative-adapter';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { packageScaffoldWriteBroker } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker';
import { gatewayExistingPackagesListBroker } from '../../../brokers/gateway/existing-packages-list/gateway-existing-packages-list-broker';
import { gatewayTsconfigPathsWriteBroker } from '../../../brokers/gateway/tsconfig-paths-write/gateway-tsconfig-paths-write-broker';
import { gatewayScopeDetectTransformer } from '../../../transformers/gateway-scope-detect/gateway-scope-detect-transformer';
import { gatewayWorkspacesMergeTransformer } from '../../../transformers/gateway-workspaces-merge/gateway-workspaces-merge-transformer';
import { gatewayImportsMergeTransformer } from '../../../transformers/gateway-imports-merge/gateway-imports-merge-transformer';
import { gatewayPackageScaffoldFilesTransformer } from '../../../transformers/gateway-package-scaffold-files/gateway-package-scaffold-files-transformer';
import { gatewayTsconfigPathsSourceValuesTransformer } from '../../../transformers/gateway-tsconfig-paths-source-values/gateway-tsconfig-paths-source-values-transformer';
import { gatewayTsconfigPathsDeclarationValuesTransformer } from '../../../transformers/gateway-tsconfig-paths-declaration-values/gateway-tsconfig-paths-declaration-values-transformer';
import { gatewayFoldersStatics } from '../../../statics/gateway-folders/gateway-folders-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const JSON_INDENT_SPACES = 2;
const TSCONFIG_BUILD_FILENAME = 'tsconfig.build.json';

export const InstallSetupGatewayResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const rootPackageJsonPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, 'package.json'],
  });

  if (!fsExistsSyncAdapter({ filePath: rootPackageJsonPath })) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('No package.json found'),
    };
  }

  const rawRootPackageJson = await fsReadFileAdapter({ filePath: rootPackageJsonPath });
  const rootPackageJson = packageJsonRawContract.parse(JSON.parse(rawRootPackageJson));
  const nameKey = packageJsonRawContract.keySchema.parse('name');
  const rootNameValue = rootPackageJson[nameKey];
  const rootPackageJsonName = typeof rootNameValue === 'string' ? rootNameValue : undefined;
  const fallbackName = pathBasenameAdapter({ path: context.targetProjectRoot });
  const scope = gatewayScopeDetectTransformer({ rootPackageJsonName, fallbackName });

  const updatedRootPackageJson = gatewayWorkspacesMergeTransformer({ rootPackageJson });
  const workspacesChanged = updatedRootPackageJson !== rootPackageJson;
  if (workspacesChanged) {
    await fsWriteFileAdapter({
      filePath: rootPackageJsonPath,
      contents: fileContentsContract.parse(
        `${JSON.stringify(updatedRootPackageJson, null, JSON_INDENT_SPACES)}\n`,
      ),
    });
  }

  const packagesDir = pathJoinAdapter({ paths: [context.targetProjectRoot, 'packages'] });
  const gatewayDir = pathJoinAdapter({ paths: [packagesDir, '@gateway'] });

  const scaffoldOutcomes = await Promise.all(
    gatewayFoldersStatics.folders.map(async (folder) => {
      const packageRoot = pathJoinAdapter({ paths: [gatewayDir, folder] });
      if (fsExistsSyncAdapter({ filePath: packageRoot })) {
        return null;
      }
      const files = gatewayPackageScaffoldFilesTransformer({ scope, folder });
      await packageScaffoldWriteBroker({ packageRoot, files });
      return folder;
    }),
  );
  const createdFolders = scaffoldOutcomes.filter((folder) => folder !== null);

  const rootRelativeToGatewayFolders = {
    npm: String(
      pathRelativeAdapter({
        from: context.targetProjectRoot,
        to: pathJoinAdapter({ paths: [gatewayDir, 'npm'] }),
      }),
    ),
    node: String(
      pathRelativeAdapter({
        from: context.targetProjectRoot,
        to: pathJoinAdapter({ paths: [gatewayDir, 'node'] }),
      }),
    ),
    browser: String(
      pathRelativeAdapter({
        from: context.targetProjectRoot,
        to: pathJoinAdapter({ paths: [gatewayDir, 'browser'] }),
      }),
    ),
    bin: String(
      pathRelativeAdapter({
        from: context.targetProjectRoot,
        to: pathJoinAdapter({ paths: [gatewayDir, 'bin'] }),
      }),
    ),
  };
  const rootTsconfigPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, locationsStatics.repoRoot.tsconfig],
  });
  const rootTsconfigExists = fsExistsSyncAdapter({ filePath: rootTsconfigPath });
  const rootTsconfigChanged = await gatewayTsconfigPathsWriteBroker({
    tsconfigPath: rootTsconfigPath,
    entries: gatewayTsconfigPathsSourceValuesTransformer({
      relativeToGatewayFolders: rootRelativeToGatewayFolders,
    }),
    skipWhenPathsMissing: false,
  });

  const existingPackageDirs = gatewayExistingPackagesListBroker({ packagesDir });

  const perPackageOutcomes = await Promise.all(
    existingPackageDirs.map(async (packageDir) => {
      const pkgPackageJsonPath = pathJoinAdapter({ paths: [packageDir, 'package.json'] });
      const rawPkgPackageJson = await fsReadFileAdapter({ filePath: pkgPackageJsonPath });
      const pkgPackageJson = packageJsonRawContract.parse(JSON.parse(rawPkgPackageJson));
      const importsKey = packageJsonRawContract.keySchema.parse('imports');
      const existingImports = pkgPackageJson[importsKey];
      const mergedImports = gatewayImportsMergeTransformer({ existingImports, scope });
      const importsChanged = mergedImports !== existingImports;

      if (importsChanged) {
        await fsWriteFileAdapter({
          filePath: pkgPackageJsonPath,
          contents: fileContentsContract.parse(
            `${JSON.stringify(
              { ...pkgPackageJson, [importsKey]: mergedImports },
              null,
              JSON_INDENT_SPACES,
            )}\n`,
          ),
        });
      }

      const pkgRelativeToGatewayFolders = {
        npm: String(
          pathRelativeAdapter({
            from: packageDir,
            to: pathJoinAdapter({ paths: [gatewayDir, 'npm'] }),
          }),
        ),
        node: String(
          pathRelativeAdapter({
            from: packageDir,
            to: pathJoinAdapter({ paths: [gatewayDir, 'node'] }),
          }),
        ),
        browser: String(
          pathRelativeAdapter({
            from: packageDir,
            to: pathJoinAdapter({ paths: [gatewayDir, 'browser'] }),
          }),
        ),
        bin: String(
          pathRelativeAdapter({
            from: packageDir,
            to: pathJoinAdapter({ paths: [gatewayDir, 'bin'] }),
          }),
        ),
      };

      const pkgTsconfigChanged = await gatewayTsconfigPathsWriteBroker({
        tsconfigPath: pathJoinAdapter({ paths: [packageDir, locationsStatics.repoRoot.tsconfig] }),
        entries: gatewayTsconfigPathsSourceValuesTransformer({
          relativeToGatewayFolders: pkgRelativeToGatewayFolders,
        }),
        skipWhenPathsMissing: true,
      });

      const pkgTsconfigBuildChanged = await gatewayTsconfigPathsWriteBroker({
        tsconfigPath: pathJoinAdapter({ paths: [packageDir, TSCONFIG_BUILD_FILENAME] }),
        entries: gatewayTsconfigPathsDeclarationValuesTransformer({
          relativeToGatewayFolders: pkgRelativeToGatewayFolders,
        }),
        skipWhenPathsMissing: false,
      });

      return { importsChanged, pkgTsconfigChanged, pkgTsconfigBuildChanged };
    }),
  );

  const updatedImportsCount = perPackageOutcomes.filter((outcome) => outcome.importsChanged).length;
  const updatedPackageTsconfigCount = perPackageOutcomes.filter(
    (outcome) => outcome.pkgTsconfigChanged,
  ).length;
  const updatedBuildTsconfigCount = perPackageOutcomes.filter(
    (outcome) => outcome.pkgTsconfigBuildChanged,
  ).length;

  const anyChange =
    workspacesChanged ||
    createdFolders.length > 0 ||
    rootTsconfigChanged ||
    updatedImportsCount > 0 ||
    updatedPackageTsconfigCount > 0 ||
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
        ? 'added gateway paths to tsconfig.json'
        : 'tsconfig.json gateway paths already present'
      : 'no tsconfig.json found to add gateway paths to',
    `updated imports in ${String(updatedImportsCount)} existing package(s)`,
    `updated tsconfig.json paths in ${String(updatedPackageTsconfigCount)} existing package(s)`,
    `updated tsconfig.build.json paths in ${String(updatedBuildTsconfigCount)} existing package(s)`,
  ];

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: anyChange ? 'created' : 'skipped',
    message: installMessageContract.parse(messageParts.join('; ')),
  };
};
