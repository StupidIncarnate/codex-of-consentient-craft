/**
 * PURPOSE: Checks if two file paths refer to the same file by testing if either path ends with the other
 *
 * USAGE:
 * isPathSuffixMatchGuard({storedPath: '/home/user/repo/src/index.ts', queryPath: 'src/index.ts'});
 * // Returns true because the stored path ends with the query path
 */

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';

export const isPathSuffixMatchGuard = ({
  storedPath,
  queryPath,
}: {
  storedPath?: ErrorEntry['filePath'] | TestFailure['suitePath'];
  queryPath?: ErrorEntry['filePath'] | TestFailure['suitePath'];
}): boolean => {
  if (!storedPath || !queryPath) {
    return false;
  }

  const stored = String(storedPath);
  const query = String(queryPath);

  return stored === query || stored.endsWith(query) || query.endsWith(stored);
};
