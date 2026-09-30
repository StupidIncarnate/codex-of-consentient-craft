/**
 * PURPOSE: Ensures the target repo's .gitignore carries every line ward's own output lands on, so a
 * repo that runs ward does not grow untracked files it never asked for. Append-only and matched per
 * entry, so a repo that already ignores some of them keeps its own ordering and comments.
 *
 * USAGE:
 * const result = await InstallWriteGitignoreResponder({ context });
 * // Appends whichever gitignoreEntriesStatics lines are missing, creating .gitignore if absent
 */

import { readFile, writeFile } from '#gateway/node/fs__promises';
import { type InstallContext, type InstallResult, installMessageContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import { gitignoreEntriesStatics } from '../../../statics/gitignore-entries/gitignore-entries-statics';

const PACKAGE_NAME = '@dungeonmaster/ward';
const GITIGNORE_FILENAME = '.gitignore';

export const InstallWriteGitignoreResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const gitignorePath = `${context.targetProjectRoot}/${GITIGNORE_FILENAME}`;

  let existingContent = '';

  try {
    existingContent = await readFile(gitignorePath);
  } catch {
    // File doesn't exist - will create new .gitignore
  }

  // Per ENTRY, not all-or-nothing. A repo that already ignores `.ward/` by hand still needs the
  // other two, and an all-or-nothing check on the first line would skip them for ever.
  const missing = gitignoreEntriesStatics.entries.filter(
    (entry) => !existingContent.includes(entry),
  );

  if (missing.length === 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('.gitignore already carries every ward entry'),
    };
  }

  const appended = `${missing.join('\n')}\n`;
  const newContent = existingContent ? `${existingContent.trimEnd()}\n${appended}` : appended;

  await writeFile(gitignorePath, newContent);

  const action = existingContent ? 'merged' : 'created';
  const message = existingContent
    ? `Added ${missing.join(', ')} to existing .gitignore`
    : `Created .gitignore with ${missing.join(', ')}`;

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action,
    message: installMessageContract.parse(message),
  };
};
