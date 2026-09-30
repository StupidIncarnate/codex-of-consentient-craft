/**
 * PURPOSE: Predicate deciding whether a path is absolute — starts with `/` (Unix) or a drive letter and backslash (Windows)
 *
 * USAGE:
 * isAbsolutePathGuard({ path: '/tmp/dm-home' });
 * // Returns true; 'relative/dm-home' and '../dm-home' return false
 */

const WINDOWS_ABSOLUTE = /^[A-Za-z]:\\/u;

export const isAbsolutePathGuard = ({ path }: { path?: string }): boolean => {
  if (path === undefined || path.length === 0) {
    return false;
  }

  return path.startsWith('/') || WINDOWS_ABSOLUTE.test(path);
};
