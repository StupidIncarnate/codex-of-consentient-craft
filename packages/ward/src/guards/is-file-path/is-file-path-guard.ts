/**
 * PURPOSE: Answers whether a single path string names a FILE (ends in an extension) as opposed
 * to a directory or package arg. Shared by `isCallerFileScopeGuard` (bounding inline output over
 * a whole `passthrough` list) and `checkRunTypecheckBroker` (deciding whether tsc's package-wide
 * errors split into "named" vs "elsewhere") — both need the same file/directory distinction over
 * one path.
 *
 * USAGE:
 * isFilePathGuard({ path: 'packages/ward/src/a.test.ts' });
 * // Returns: true
 * isFilePathGuard({ path: 'packages/ward' });
 * // Returns: false — no extension, so this names a directory or package
 */

const NAMES_ONE_FILE = /\.[A-Za-z0-9]+$/u;

export const isFilePathGuard = ({ path }: { path?: string }): boolean => {
  if (path === undefined) {
    return false;
  }
  return NAMES_ONE_FILE.test(path);
};
