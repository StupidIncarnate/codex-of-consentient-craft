/**
 * PURPOSE: Install CLI package by adding required devDependencies to target project's package.json
 *
 * USAGE:
 * const result = await StartInstall({ context });
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
import { fsReadFileAdapter } from '../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../adapters/fs/write-file/fs-write-file-adapter';
import { devDependenciesStatics } from '../statics/dev-dependencies/dev-dependencies-statics';
import { extractDevDependenciesTransformer } from '../transformers/extract-dev-dependencies/extract-dev-dependencies-transformer';

const PACKAGE_NAME = '@dungeonmaster/cli';
const JSON_INDENT_SPACES = 2;

export const StartInstall = async ({
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
  const packageJson: unknown = JSON.parse(packageJsonContent);

  if (typeof packageJson !== 'object' || packageJson === null) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('Invalid package.json'),
    };
  }

  const existingDevDeps = extractDevDependenciesTransformer({ packageJson });

  const requiredPackages = devDependenciesStatics.packages;
  let missingCount = 0;

  for (const name of Object.keys(requiredPackages)) {
    if (!(name in existingDevDeps)) {
      missingCount += 1;
      Reflect.set(existingDevDeps, name, Reflect.get(requiredPackages, name));
    }
  }

  if (missingCount === 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('All devDependencies already present'),
    };
  }

  const updatedPackageJson = { ...packageJson, devDependencies: existingDevDeps };

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
