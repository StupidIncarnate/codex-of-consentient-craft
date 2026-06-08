/**
 * PURPOSE: Checks if a file path is a Playwright e2e test (any `.e2e.ts` file, colocated anywhere)
 *
 * USAGE:
 * isE2eTestPathGuard({ filePath: 'packages/web/src/flows/home/guild-delete.e2e.ts' }); // true
 * isE2eTestPathGuard({ filePath: 'src/foo.test.ts' }); // false
 */

export const isE2eTestPathGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return filePath.endsWith('.e2e.ts');
};
