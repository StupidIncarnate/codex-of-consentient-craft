/**
 * PURPOSE: Install config package by creating .dungeonmaster config file in target project
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .dungeonmaster config file with default settings or skips if already exists
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '../adapters/path/join/path-join-adapter';
import { fsAccessAdapter } from '../adapters/fs/access/fs-access-adapter';
import { fsWriteFileAdapter } from '../adapters/fs/write-file/fs-write-file-adapter';
import { constants } from 'fs';

const CONFIG_FILENAME = '.dungeonmaster';
const PACKAGE_NAME = '@dungeonmaster/config';
const JSON_INDENT_SPACES = 2;

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, CONFIG_FILENAME],
  });

  try {
    await fsAccessAdapter({ filePath: configPath, mode: constants.F_OK });

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('Config already exists'),
    };
  } catch {
    const defaultConfig = {
      framework: 'node',
      schema: 'zod',
    };

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
