/**
 * PURPOSE: Checks if a file path has a source code extension that ward check types can process
 *
 * USAGE:
 * isSourceFileGuard({ filePath: 'src/index.ts' }); // true
 * isSourceFileGuard({ filePath: 'README.md' }); // false
 */

export const isSourceFileGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return /\.[cm]?[jt]sx?$/u.test(filePath);
};
