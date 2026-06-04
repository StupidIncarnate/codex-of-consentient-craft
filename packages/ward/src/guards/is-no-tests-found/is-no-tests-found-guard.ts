/**
 * PURPOSE: Detects Jest's "no tests found" banner in captured output, distinguishing a zero-match
 * run from a genuine test failure (which emits a JSON report instead of the banner)
 *
 * USAGE:
 * isNoTestsFoundGuard({ output: 'No tests found, exiting with code 1' }); // true
 * isNoTestsFoundGuard({ output: '{"testResults":[],"success":true}' }); // false
 *
 * WHEN-TO-USE: In file-scoped runs (--changed / passthrough) to treat "no related tests" as a skip
 * WHEN-NOT-TO-USE: In full runs, where a missing-tests banner signals a real misconfiguration to surface
 */

export const isNoTestsFoundGuard = ({ output }: { output?: string }): boolean => {
  if (output === undefined) {
    return false;
  }
  return /^No tests found/mu.test(output);
};
