/**
 * PURPOSE: Checks if a file path is a unit test (not integration or e2e)
 *
 * USAGE:
 * isUnitTestPathGuard({ filePath: 'src/foo.test.ts' }); // true
 * isUnitTestPathGuard({ filePath: 'src/foo.integration.test.ts' }); // false
 */

export const isUnitTestPathGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return !/\.integration\.test\.[jt]sx?$|\.e2e\.test\.[jt]sx?$/u.test(filePath);
};
