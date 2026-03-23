/**
 * PURPOSE: Checks if an import source points to a harness file
 *
 * USAGE:
 * if (isHarnessImportGuard({ importSource: './guild.harness' })) {
 *   // Import is from a harness file
 * }
 * // Returns true if import ends with .harness, .harness.ts, or contains .harness/
 */
import { hasFileSuffixGuard } from '../has-file-suffix/has-file-suffix-guard';

export const isHarnessImportGuard = ({ importSource }: { importSource?: string }): boolean => {
  if (!importSource) {
    return false;
  }

  return (
    hasFileSuffixGuard({ filename: importSource, suffix: 'harness' }) ||
    importSource.endsWith('.harness') ||
    importSource.includes('.harness/')
  );
};
