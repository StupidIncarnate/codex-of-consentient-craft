/**
 * PURPOSE: Adds the ward / lint / typecheck / test npm scripts to the target project's package.json
 * (idempotent — skips any script already defined) so `npm run ward` resolves the dungeonmaster-ward bin.
 *
 * USAGE:
 * const result = await InstallWriteScriptsResponder({ context });
 * // Merges missing ward scripts into package.json, or skips if all present / no package.json
 */

import {
  type InstallContext,
  type InstallResult,
  installResultContract,
  packageJsonContract,
} from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { installScriptsStatics } from '../../../statics/install-scripts/install-scripts-statics';

const PACKAGE_NAME = '@dungeonmaster/ward';
const PACKAGE_JSON_FILENAME = 'package.json';

export const InstallWriteScriptsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageJsonPath = `${context.targetProjectRoot}/${PACKAGE_JSON_FILENAME}`;

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

  const existingScripts = parsedPackageJson.data.scripts ?? {};
  const requiredScripts = installScriptsStatics.scripts;
  const scriptsToAdd = Object.fromEntries(
    Object.entries(requiredScripts).filter(([name]) => !(name in existingScripts)),
  );

  if (Object.keys(scriptsToAdd).length === 0) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: true,
      action: 'skipped',
      message: 'All ward scripts already present',
    });
  }

  // Keep existing scripts untouched; only append the missing ward scripts.
  const mergedScripts = { ...existingScripts, ...scriptsToAdd };
  // Preserve the original top-level key order. packageJsonContract's object parse hoists declared
  // keys, so build the write from an order-preserving record parse.
  const orderedPackageJson = packageJsonRawContract.parse(JSON.parse(packageJsonContent));
  const updatedPackageJson = { ...orderedPackageJson, scripts: mergedScripts };

  const contents = jsonFileContentsTransformer({ value: updatedPackageJson });
  await writeFile(packageJsonPath, contents);

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: 'Added ward scripts to package.json',
  });
};
