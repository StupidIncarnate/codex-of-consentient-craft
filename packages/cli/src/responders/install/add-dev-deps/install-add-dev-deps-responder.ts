/**
 * PURPOSE: Reads target project package.json, merges missing devDependencies, and writes the updated file
 *
 * USAGE:
 * const result = await InstallAddDevDepsResponder({ context });
 * // Adds devDependencies to package.json or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter, fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { devDependenciesStatics } from '../../../statics/dev-dependencies/dev-dependencies-statics';
import { extractDevDependenciesTransformer } from '../../../transformers/extract-dev-dependencies/extract-dev-dependencies-transformer';
import { dependencyMapContract } from '../../../contracts/dependency-map/dependency-map-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';

const PACKAGE_NAME = '@dungeonmaster/cli';
const JSON_INDENT_SPACES = 2;

export const InstallAddDevDepsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageJsonPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, 'package.json'],
  });

  if (!fsExistsSyncAdapter({ filePath: packageJsonPath })) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('No package.json found'),
    };
  }

  const packageJsonContent = await fsReadFileAdapter({ filePath: packageJsonPath });
  const parsedPackageJson = packageJsonContract.safeParse(JSON.parse(packageJsonContent));

  if (!parsedPackageJson.success) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('Invalid package.json'),
    };
  }

  const packageJson = parsedPackageJson.data;
  const existingDevDeps = extractDevDependenciesTransformer({ packageJson });

  const requiredPackages = devDependenciesStatics.packages;
  const missingCount = Object.keys(requiredPackages).filter(
    (name) => !(name in existingDevDeps),
  ).length;

  if (missingCount === 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('All devDependencies already present'),
    };
  }

  const mergedDevDeps = dependencyMapContract.parse({ ...requiredPackages, ...existingDevDeps });
  const updatedPackageJson = { ...packageJson, devDependencies: mergedDevDeps };

  const contents = fileContentsContract.parse(
    JSON.stringify(updatedPackageJson, null, JSON_INDENT_SPACES),
  );

  await fsWriteFileAdapter({ filePath: packageJsonPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Added devDependencies to package.json'),
  };
};
