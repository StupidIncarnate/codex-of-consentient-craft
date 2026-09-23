/**
 * PURPOSE: Answers whether a path sits AT or UNDER a directory — exact match, or the directory plus
 * exactly one trailing separator, after stripping any trailing slash EITHER side already carries
 * (a caller may pass `packages/hooks/` or a bare error path with none). The separator is
 * load-bearing: without it, a plain string prefix check on `src/widget` would also claim
 * `src/widgets-extra`, a sibling directory it never contains.
 *
 * USAGE:
 * isPathUnderDirectoryGuard({ path: 'src/widgets/foo.ts', directory: 'src/widgets' });
 * // Returns: true
 * isPathUnderDirectoryGuard({ path: 'src/widgets-extra/foo.ts', directory: 'src/widgets' });
 * // Returns: false — the separator rules out a same-prefix sibling
 */

const TRAILING_SLASHES = /\/+$/u;

export const isPathUnderDirectoryGuard = ({
  path,
  directory,
}: {
  path?: string;
  directory?: string;
}): boolean => {
  if (path === undefined || directory === undefined) {
    return false;
  }

  const resolvedDirectory = directory.replace(TRAILING_SLASHES, '');

  if (resolvedDirectory.length === 0) {
    return false;
  }

  const resolvedPath = path.replace(TRAILING_SLASHES, '');
  const prefix = `${resolvedDirectory}/`;

  return resolvedPath === resolvedDirectory || resolvedPath.startsWith(prefix);
};
