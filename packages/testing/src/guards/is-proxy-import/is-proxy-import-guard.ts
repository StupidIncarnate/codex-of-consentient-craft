/**
 * PURPOSE: Checks if an import path is a proxy file import (contains '.proxy')
 *
 * USAGE:
 * isProxyImportGuard({importPath: './test.proxy'});
 * // Returns true if import path contains '.proxy', false otherwise
 */

export const isProxyImportGuard = ({ importPath }: { importPath?: string }): boolean => {
  if (!importPath) {
    return false;
  }
  return importPath.includes('.proxy');
};
