/**
 * PURPOSE: Checks if two file paths refer to the same file by testing if either path ends with the other
 *
 * USAGE:
 * isPathSuffixMatchGuard({storedPath: '/home/user/repo/src/index.ts', queryPath: 'src/index.ts'});
 * // Returns true because the stored path ends with the query path
 */

export const isPathSuffixMatchGuard = ({
  storedPath,
  queryPath,
}: {
  storedPath?: string;
  queryPath?: string;
}): boolean => {
  if (!storedPath || !queryPath) {
    return false;
  }

  return storedPath === queryPath || storedPath.endsWith(queryPath) || queryPath.endsWith(storedPath);
};
