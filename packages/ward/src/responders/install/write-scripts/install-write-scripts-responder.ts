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
  installMessageContract,
  packageNameContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { packageJsonRawContract } from '../../../contracts/package-json-raw/package-json-raw-contract';
import { installScriptsStatics } from '../../../statics/install-scripts/install-scripts-statics';

const PACKAGE_NAME = '@dungeonmaster/ward';
const PACKAGE_JSON_FILENAME = 'package.json';
const JSON_INDENT_SPACES = 2;

export const InstallWriteScriptsResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageJsonPath = filePathContract.parse(
    `${context.targetProjectRoot}/${PACKAGE_JSON_FILENAME}`,
  );

  if (!fsExistsSyncAdapter({ filePath: packageJsonPath })) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'skipped',
      message: installMessageContract.parse('No package.json found'),
    };
  }

  const packageJsonContent = await fsReadFileAdapter({ filePath: packageJsonPath });
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

  const existingScripts = parsedPackageJson.data.scripts ?? {};
  const requiredScripts = installScriptsStatics.scripts;
  const scriptsToAdd = Object.fromEntries(
    Object.entries(requiredScripts).filter(([name]) => !(name in existingScripts)),
  );

  if (Object.keys(scriptsToAdd).length === 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('All ward scripts already present'),
    };
  }

  // Keep existing scripts untouched; only append the missing ward scripts.
  const mergedScripts = { ...existingScripts, ...scriptsToAdd };
  // Preserve the original top-level key order. packageJsonContract's object parse hoists declared
  // keys, so build the write from an order-preserving record parse.
  const orderedPackageJson = packageJsonRawContract.parse(rawParsed);
  const updatedPackageJson = { ...orderedPackageJson, scripts: mergedScripts };

  const contents = fileContentsContract.parse(
    JSON.stringify(updatedPackageJson, null, JSON_INDENT_SPACES),
  );
  await fsWriteFileAdapter({ filePath: packageJsonPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Added ward scripts to package.json'),
  };
};
