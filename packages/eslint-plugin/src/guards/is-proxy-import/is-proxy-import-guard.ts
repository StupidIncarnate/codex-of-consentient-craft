import { hasFileSuffixGuard } from '../has-file-suffix/has-file-suffix-guard';

/**
 * PURPOSE: Checks if an import source points to a proxy file
 *
 * USAGE:
 * if (isProxyImportGuard({ importSource: './user-fetch.proxy' })) {
 *   // Import is from a proxy file
 * }
 * // Returns true if import ends with .proxy, .proxy.ts, .proxy.tsx or contains .proxy/
 */
export const isProxyImportGuard = ({ importSource }: { importSource?: string }): boolean => {
  if (!importSource) {
    return false;
  }

  return (
    hasFileSuffixGuard({ filename: importSource, suffix: 'proxy' }) ||
    importSource.endsWith('.proxy') ||
    importSource.includes('.proxy/')
  );
};
