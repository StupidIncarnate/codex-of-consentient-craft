/**
 * PURPOSE: Install ward package by adding .ward/ to target project's .gitignore
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Adds .ward/ to .gitignore or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapter } from '../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../adapters/fs/write-file/fs-write-file-adapter';

const PACKAGE_NAME = '@dungeonmaster/ward';
const GITIGNORE_FILENAME = '.gitignore';
const WARD_ENTRY = '.ward/';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const gitignorePath = filePathContract.parse(
    `${context.targetProjectRoot}/${GITIGNORE_FILENAME}`,
  );

  let existingContent = '';

  try {
    existingContent = await fsReadFileAdapter({ filePath: gitignorePath });
  } catch {
    // File doesn't exist - will create new .gitignore
  }

  if (existingContent.includes(WARD_ENTRY)) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('.ward/ already in .gitignore'),
    };
  }

  const newContent = existingContent
    ? `${existingContent.trimEnd()}\n${WARD_ENTRY}\n`
    : `${WARD_ENTRY}\n`;

  await fsWriteFileAdapter({
    filePath: gitignorePath,
    contents: fileContentsContract.parse(newContent),
  });

  const action = existingContent ? 'merged' : 'created';
  const message = existingContent
    ? 'Added .ward/ to existing .gitignore'
    : 'Created .gitignore with .ward/';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action,
    message: installMessageContract.parse(message),
  };
};
