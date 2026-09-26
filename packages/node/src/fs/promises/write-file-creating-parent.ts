/**
 * PURPOSE: Writes UTF-8 text after creating the target's parent directory tree, so writing into a
 * directory that does not exist yet (a brand-new project's .claude/) succeeds instead of rejecting
 * ENOENT. Not atomic. Reach for writeFileAtomic when the parent is known to exist and the write
 * must be crash-safe instead.
 *
 * USAGE:
 * await writeFileCreatingParent('/project/.claude/settings.json', '{"hooks":{}}');
 * // Creates /project/.claude if missing, then writes the file
 */

import { mkdir, writeFile as fsWriteFile } from 'fs/promises';
import { dirname } from 'path';

export const writeFileCreatingParent = async (path: string, contents: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await fsWriteFile(path, contents, 'utf8');
};
