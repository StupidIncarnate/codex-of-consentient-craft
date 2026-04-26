/**
 * PURPOSE: Checks for existing .dungeonmaster config file and creates one with defaults if missing
 *
 * USAGE:
 * const result = await InstallCreateConfigResponder({ context });
 * // Creates .dungeonmaster config or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

const CONFIG_FILENAME = locationsStatics.dungeonmasterHome.dir;
const PACKAGE_NAME = '@dungeonmaster/config';
const JSON_INDENT_SPACES = 2;
const F_OK = 0;

export const InstallCreateConfigResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, CONFIG_FILENAME],
  });

  try {
    await fsAccessAdapter({ filePath: configPath, mode: F_OK });
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('Config already exists'),
    };
  } catch {
    const defaultConfig = { framework: 'node-library', schema: 'zod' };
    const contents = fileContentsContract.parse(
      JSON.stringify(defaultConfig, null, JSON_INDENT_SPACES),
    );
    await fsWriteFileAdapter({ filepath: configPath, contents });
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'created',
      message: installMessageContract.parse('Created .dungeonmaster config'),
    };
  }
};
