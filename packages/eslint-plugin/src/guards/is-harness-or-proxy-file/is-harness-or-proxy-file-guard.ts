/**
 * PURPOSE: Determines if a file is a test harness or proxy companion file (excluded from cwd lint enforcement)
 *
 * USAGE:
 * if (isHarnessOrProxyFileGuard({ filename: 'foo.harness.ts' })) {
 *   // Returns true - file is a harness or proxy companion
 * }
 *
 * WHEN-TO-USE: When a rule needs to skip test infrastructure files alongside the standard test-file check
 */
import { noBareProcessCwdStatics } from '../../statics/no-bare-process-cwd/no-bare-process-cwd-statics';

export const isHarnessOrProxyFileGuard = ({
  filename,
}: {
  filename?: string | undefined;
}): boolean => {
  if (filename === undefined) {
    return false;
  }
  return noBareProcessCwdStatics.testCompanionSuffixes.some((suffix) => filename.endsWith(suffix));
};
