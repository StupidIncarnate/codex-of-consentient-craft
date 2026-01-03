/**
 * PURPOSE: Checks if an import path is a proxy file import (contains '.proxy' or is a proxy barrel)
 *
 * USAGE:
 * isProxyImportGuard({importPath: './test.proxy'});
 * // Returns true if import path contains '.proxy' or is @dungeonmaster/shared/testing
 */

export const isProxyImportGuard = ({ importPath }: { importPath?: string }): boolean => {
  if (!importPath) {
    return false;
  }
  return importPath.includes('.proxy') || importPath === '@dungeonmaster/shared/testing';
};
