/**
 * PURPOSE: Checks if a file path is a test file that is NOT an integration test (unit or e2e test)
 *
 * USAGE:
 * isNonIntegrationTestGuard({ filePath: 'src/foo.test.ts' }); // true (unit test, not integration)
 * isNonIntegrationTestGuard({ filePath: 'src/foo.integration.test.ts' }); // false (integration test)
 * isNonIntegrationTestGuard({ filePath: 'src/foo.ts' }); // false (not a test file)
 */

export const isNonIntegrationTestGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return filePath.endsWith('.test.ts') && !filePath.endsWith('.integration.test.ts');
};
