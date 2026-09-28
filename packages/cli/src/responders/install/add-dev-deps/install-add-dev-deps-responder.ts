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
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { devDependenciesStatics } from '../../../statics/dev-dependencies/dev-dependencies-statics';
import { extractDevDependenciesTransformer } from '../../../transformers/extract-dev-dependencies/extract-dev-dependencies-transformer';
import { dependencyMapContract } from '../../../contracts/dependency-map/dependency-map-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';

const PACKAGE_NAME = '@dungeonmaster/cli';

export const InstallAddDevDepsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageJsonPath = filePathContract.parse(join(context.targetProjectRoot, 'package.json'));

  if (!existsSync(packageJsonPath)) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('No package.json found'),
    };
  }

  const packageJsonContent = await readFile(packageJsonPath);
  const rawParsed: unknown = JSON.parse(packageJsonContent);
  const parsedPackageJson = packageJsonContract.safeParse(rawParsed);

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

  // Sort the merged map alphabetically rather than keeping `requiredPackages`' declaration order
  // followed by whatever extras `existingDevDeps` added: a plain `{...requiredPackages,
  // ...existingDevDeps}` spread fixes each key's position at its FIRST insertion, so an existing
  // package outside the required set (ts-node, @changesets/cli, ...) always lands after every
  // required one instead of at its alphabetical position — silently reordering an already-sorted
  // consumer package.json on every `init` re-run.
  const mergedEntries = Object.entries({ ...requiredPackages, ...existingDevDeps }).sort(
    ([keyA], [keyB]) => keyA.localeCompare(keyB),
  );
  const mergedDevDeps = dependencyMapContract.parse(Object.fromEntries(mergedEntries));
  // Preserve the original top-level key order (name/version/license first). packageJsonContract's
  // object parse hoists declared keys, so build the write from an order-preserving record parse.
  const orderedPackageJson = packageJsonRawContract.parse(rawParsed);
  const updatedPackageJson = { ...orderedPackageJson, devDependencies: mergedDevDeps };

  const contents = jsonFileContentsTransformer({ value: updatedPackageJson });

  await writeFile(packageJsonPath, contents);

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Added devDependencies to package.json'),
  };
};
