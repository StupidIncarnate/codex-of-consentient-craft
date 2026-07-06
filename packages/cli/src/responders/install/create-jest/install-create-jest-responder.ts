/**
 * PURPOSE: Writes a root jest.config.js spreading the published @dungeonmaster/testing base, or skips if one exists
 *
 * USAGE:
 * const result = await InstallCreateJestResponder({ context });
 * // Creates jest.config.js (spreads @dungeonmaster/testing/jest-config-base) or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter, fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { jestConfigTemplateStatics } from '../../../statics/jest-config-template/jest-config-template-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const CONFIG_FILENAME = 'jest.config.js';

export const InstallCreateJestResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, CONFIG_FILENAME],
  });

  if (fsExistsSyncAdapter({ filePath: configPath })) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('jest.config.js already exists'),
    };
  }

  const contents = fileContentsContract.parse(jestConfigTemplateStatics.content);

  await fsWriteFileAdapter({ filePath: configPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created jest.config.js'),
  };
};
