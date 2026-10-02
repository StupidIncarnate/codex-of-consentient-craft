/**
 * PURPOSE: Walks up from startPath looking for a directory containing .gitignore (stopping when
 * .dungeonmaster.json project root or filesystem root is reached)
 *
 * USAGE:
 * const contents = await discoverIgnoreInitWalkUpLayerBroker({ startPath: '/repo/.agents/plugins/dungeonmaster' });
 * // Returns contents of .gitignore, or null if none found
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

const GITIGNORE_FILENAME = '.gitignore';

export const discoverIgnoreInitWalkUpLayerBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: string;
  currentPath?: string;
}): Promise<string | null> => {
  const searchPath = currentPath ?? startPath;

  const gitignorePath = join(searchPath, GITIGNORE_FILENAME);
  const contents = await readFileIfExists(gitignorePath);
  if (contents !== null) {
    return contents;
  }

  // Stop climbing if searchPath contains .dungeonmaster.json without escaping into enclosing folders
  const hasConfig = await readFileIfExists(join(searchPath, locationsStatics.repoRoot.config));
  if (hasConfig !== null) {
    return null;
  }

  const parentPath = dirname(searchPath);
  if (parentPath === searchPath) {
    return null;
  }

  return discoverIgnoreInitWalkUpLayerBroker({
    startPath,
    currentPath: parentPath,
  });
};
