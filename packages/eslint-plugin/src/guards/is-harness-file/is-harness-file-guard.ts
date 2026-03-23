/**
 * PURPOSE: Determines if a file is a harness file based on the .harness.ts suffix
 *
 * USAGE:
 * if (isHarnessFileGuard({ filename: 'guild.harness.ts' })) {
 *   // Returns true - file is a harness file
 * }
 * if (isHarnessFileGuard({ filename: 'guild-broker.ts' })) {
 *   // Returns false - not a harness file
 * }
 *
 * WHEN-TO-USE: Use to identify harness files for e2e/integration test infrastructure rules
 */
import { hasFileSuffixGuard } from '../has-file-suffix/has-file-suffix-guard';

export const isHarnessFileGuard = ({ filename }: { filename?: string | undefined }): boolean => {
  if (filename === undefined) {
    return false;
  }

  return hasFileSuffixGuard({ filename, suffix: 'harness' });
};
