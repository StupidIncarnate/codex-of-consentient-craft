/**
 * PURPOSE: Wraps fs.readdir to return entries when the dir exists, or undefined when it does not — used by the Claude Code session resolver, which treats "no sessions dir" as a normal "not announced yet" case rather than a failure.
 *
 * USAGE:
 * const entries = await fsReaddirIfExistsAdapter({ filepath: PathSegmentStub({ value: '/home/u/.claude/projects/-foo' }) });
 * // Returns FolderName[] when dir exists, or undefined when ENOENT/ENOTDIR
 */

import { readdir } from 'fs/promises';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

import { folderNameContract } from '../../../contracts/folder-name/folder-name-contract';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';

export const fsReaddirIfExistsAdapter = async ({
  filepath,
}: {
  filepath: PathSegment;
}): Promise<FolderName[] | undefined> => {
  try {
    const entries = await readdir(filepath);
    return entries.map((entry) => folderNameContract.parse(entry));
  } catch {
    return undefined;
  }
};
