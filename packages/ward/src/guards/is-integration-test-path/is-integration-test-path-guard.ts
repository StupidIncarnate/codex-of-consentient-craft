/**
 * PURPOSE: Checks if a file path is an integration test
 *
 * USAGE:
 * isIntegrationTestPathGuard({ filePath: 'src/foo.integration.test.ts' }); // true
 * isIntegrationTestPathGuard({ filePath: 'src/foo.test.ts' }); // false
 */

export const isIntegrationTestPathGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return /\.integration\.test\.[jt]sx?$/u.test(filePath);
};
