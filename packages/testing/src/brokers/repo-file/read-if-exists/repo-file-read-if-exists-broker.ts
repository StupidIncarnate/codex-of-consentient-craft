/**
 * PURPOSE: Reads a repo file's contents through the gateway, answering null when it is absent —
 * so a harness or fixture check reaches #gateway/node/fs__promises directly instead of hand-rolling
 * its own ENOENT check.
 *
 * USAGE:
 * await repoFileReadIfExistsBroker({ path: '/repo/.dungeonmaster.json' });
 * // Returns the file's contents, or null when the path does not exist
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

export const repoFileReadIfExistsBroker = async ({
  path,
}: {
  path: string;
}): Promise<FileContent | null> => {
  const contents = await readFileIfExists(path);
  return contents === null ? null : fileContentContract.parse(contents);
};
