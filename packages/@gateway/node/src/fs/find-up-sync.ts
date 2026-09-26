/**
 * PURPOSE: Walks a directory tree upward looking for `fileName`, replacing the identical
 * hand-rolled walk that used to live separately in mcp and siegelense. Recursion, not a
 * `while (true)` loop — `dirname(path) === path` at the filesystem root is the base case.
 *
 * USAGE:
 * const found = findUpSync({ startDir: '/repo/packages/node/src', fileName: 'package.json' });
 * // Returns the first matching path found walking upward, or null at the root with no match
 */
import { dirname, join } from 'path';
import { existsSync } from './exists-sync';

export const findUpSync = ({
  startDir,
  fileName,
}: {
  startDir: string;
  fileName: string;
}): string | null => {
  const candidate = join(startDir, fileName);
  if (existsSync(candidate)) {
    return candidate;
  }

  const parent = dirname(startDir);
  if (parent === startDir) {
    return null;
  }

  return findUpSync({ startDir: parent, fileName });
};
