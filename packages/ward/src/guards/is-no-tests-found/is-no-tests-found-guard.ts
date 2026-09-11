/**
 * PURPOSE: Detects Jest's "no tests found" banner in captured output, distinguishing a zero-match
 * run from a genuine test failure (which emits a JSON report instead of the banner)
 *
 * USAGE:
 * isNoTestsFoundGuard({ output: 'No tests found, exiting with code 1' }); // true
 * isNoTestsFoundGuard({ output: '{"testResults":[],"success":true}' }); // false
 *
 * WHEN-TO-USE: In file-scoped runs (--committed / --uncommitted / passthrough) to treat "no related tests" as a skip
 * WHEN-NOT-TO-USE: In full runs, where a missing-tests banner signals a real misconfiguration to surface
 */

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { stripAnsiCodesTransformer } from '../../transformers/strip-ansi-codes/strip-ansi-codes-transformer';

export const isNoTestsFoundGuard = ({ output }: { output?: string }): boolean => {
  if (output === undefined || output.length === 0) {
    return false;
  }
  // Jest BOLDS this banner even under `--no-color`, which ward passes on every jest command, so the
  // captured line really begins with an escape and a line-anchored match never fires against it.
  // Measured: a file-scoped integration run whose scope had no related integration test reported
  // `(crash) No tests found` for eight packages, where the honest answer is a skip.
  //
  // The colour codes come off rather than the anchor coming off the pattern: an unanchored match
  // would also fire on these words appearing inside a test NAME in jest's JSON report, which is the
  // one case this guard exists to tell apart.
  const clean = stripAnsiCodesTransformer({ text: errorMessageContract.parse(output) });

  return /^No tests found/mu.test(String(clean));
};
