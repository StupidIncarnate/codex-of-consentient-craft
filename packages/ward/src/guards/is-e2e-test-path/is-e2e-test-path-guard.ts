/**
 * PURPOSE: Checks if a file path matches an E2E test pattern (.spec.ts in e2e/ or tests/e2e/)
 *
 * USAGE:
 * isE2eTestPathGuard({ filePath: 'e2e/web/smoke.spec.ts' }); // true
 * isE2eTestPathGuard({ filePath: 'src/foo.test.ts' }); // false
 */

export const isE2eTestPathGuard = ({ filePath }: { filePath?: string }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return /(?:^|\/)(?:e2e|tests\/e2e)\/.+\.spec\.ts$/u.test(filePath);
};
