/**
 * PURPOSE: Writes a root jest.config.js spreading the published @dungeonmaster/testing base, or skips
 * if one exists or the target is an npm-workspaces monorepo. A workspaces root has no top-level src/
 * for this template's `roots` to point at, and every workspace package already carries its own
 * jest.config.js — spreading the PUBLISHED base at the root would also resolve `@dungeonmaster/*` to
 * compiled dist instead of source for anything that ran under it.
 *
 * USAGE:
 * const result = await InstallCreateJestResponder({ context });
 * // Creates jest.config.js (spreads @dungeonmaster/testing/jest-config-base), or skips if already
 * // present or the target has npm workspaces
 */

import { type InstallContext, type InstallResult, installMessageContract, packageNameContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { readFile, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { jestConfigTemplateStatics } from '../../../statics/jest-config-template/jest-config-template-statics';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';

const PACKAGE_NAME = '@dungeonmaster/cli';
const CONFIG_FILENAME = 'jest.config.js';

export const InstallCreateJestResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageJsonPath = join(context.targetProjectRoot, 'package.json');

  if (existsSync(packageJsonPath)) {
    const packageJsonContent = await readFile(packageJsonPath);
    const parsedPackageJson = packageJsonContract.safeParse(JSON.parse(packageJsonContent));

    if (
      parsedPackageJson.success &&
      parsedPackageJson.data.workspaces !== undefined &&
      parsedPackageJson.data.workspaces.length > 0
    ) {
      return {
        packageName: packageNameContract.parse(PACKAGE_NAME),
        success: true,
        action: 'skipped',
        message: installMessageContract.parse(
          'target project has npm workspaces (each package owns its own jest.config.js)',
        ),
      };
    }
  }

  const configPath = join(context.targetProjectRoot, CONFIG_FILENAME);

  if (existsSync(configPath)) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('jest.config.js already exists'),
    };
  }

  const contents = fileContentsContract.parse(jestConfigTemplateStatics.content);

  await writeFile(configPath, contents);

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created jest.config.js'),
  };
};
