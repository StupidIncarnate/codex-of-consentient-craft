/**
 * PURPOSE: Checks if a path is absolute, either POSIX (`/…`) or a Windows drive path (`C:\…`)
 *
 * USAGE:
 * isAbsolutePathGuard({ path: '/tmp' }); // true
 * isAbsolutePathGuard({ path: 'tmp' }); // false
 */

export const isAbsolutePathGuard = ({ path }: { path?: string }): boolean => {
  if (path === undefined) {
    return false;
  }
  return path.startsWith('/') || /^[A-Za-z]:\\/u.test(path);
};
