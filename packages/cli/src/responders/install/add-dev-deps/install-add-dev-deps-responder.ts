/**
 * PURPOSE: Reads target project package.json, merges missing devDependencies, and writes the updated file.
 * An entry the target already declares is never rewritten; a `@dungeonmaster/*` entry added beside
 * `file:` siblings is written as a `file:` path into the dungeonmaster install running init.
 *
 * USAGE:
 * const result = await InstallAddDevDepsResponder({ context });
 * // Adds devDependencies to package.json or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installResultContract,
  packageJsonContract,
} from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { devDependenciesStatics } from '../../../statics/dev-dependencies/dev-dependencies-statics';
import { hasLocalDungeonmasterDependencyGuard } from '../../../guards/has-local-dungeonmaster-dependency/has-local-dungeonmaster-dependency-guard';
import { packageDiscoverBroker } from '../../../brokers/package/discover/package-discover-broker';
import { devDependencySpecifierTransformer } from '../../../transformers/dev-dependency-specifier/dev-dependency-specifier-transformer';
import { extractDevDependenciesTransformer } from '../../../transformers/extract-dev-dependencies/extract-dev-dependencies-transformer';
import { dependencyMapContract } from '../../../contracts/dependency-map/dependency-map-contract';
import { packageJsonRawContract } from '@dungeonmaster/shared/contracts';

const PACKAGE_NAME = '@dungeonmaster/cli';

export const InstallAddDevDepsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageJsonPath = join(context.targetProjectRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: false,
      action: 'skipped',
      message: 'No package.json found',
    });
  }

  const packageJsonContent = await readFile(packageJsonPath);
  const parsedPackageJson = packageJsonContract.safeParse(JSON.parse(packageJsonContent));

  if (!parsedPackageJson.success) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: false,
      action: 'skipped',
      message: 'Invalid package.json',
    });
  }

  const packageJson = parsedPackageJson.data;
  const existingDevDeps = extractDevDependenciesTransformer({ packageJson });

  const missingEntries = Object.entries(devDependenciesStatics.packages).filter(
    ([name]) => !(name in existingDevDeps),
  );

  if (missingEntries.length === 0) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: true,
      action: 'skipped',
      message: 'All devDependencies already present',
    });
  }

  // Discovery runs only for a target that takes dungeonmaster through `file:` — the one case a
  // package's directory on disk decides what gets written.
  const packageDirs = new Map(
    hasLocalDungeonmasterDependencyGuard({ dependencies: existingDevDeps })
      ? packageDiscoverBroker({ dungeonmasterRoot: context.dungeonmasterRoot }).map(
          ({ packageName, packageDir }) => [String(packageName), String(packageDir)] as const,
        )
      : [],
  );
  const addedDevDeps = Object.fromEntries(
    missingEntries.map(([name, range]) => {
      const packageDir = packageDirs.get(name);
      return [
        name,
        devDependencySpecifierTransformer({
          packageName: name,
          range,
          existingDevDeps,
          targetProjectRoot: context.targetProjectRoot,
          ...(packageDir === undefined ? {} : { packageDir }),
        }),
      ];
    }),
  );

  // Sort the merged map alphabetically rather than keeping the statics' declaration order
  // followed by whatever extras `existingDevDeps` added: a plain `{...addedDevDeps,
  // ...existingDevDeps}` spread fixes each key's position at its FIRST insertion, so an existing
  // package outside the required set (ts-node, @changesets/cli, ...) always lands after every
  // required one instead of at its alphabetical position — silently reordering an already-sorted
  // consumer package.json on every `init` re-run.
  const mergedEntries = Object.entries({ ...addedDevDeps, ...existingDevDeps }).sort(
    ([keyA], [keyB]) => keyA.localeCompare(keyB),
  );
  const mergedDevDeps = dependencyMapContract.parse(Object.fromEntries(mergedEntries));
  // Preserve the original top-level key order (name/version/license first). packageJsonContract's
  // object parse hoists declared keys, so build the write from an order-preserving record parse.
  const orderedPackageJson = packageJsonRawContract.parse(JSON.parse(packageJsonContent));
  const updatedPackageJson = { ...orderedPackageJson, devDependencies: mergedDevDeps };

  const contents = jsonFileContentsTransformer({ value: updatedPackageJson });

  await writeFile(packageJsonPath, contents);

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: 'Added devDependencies to package.json',
  });
};
