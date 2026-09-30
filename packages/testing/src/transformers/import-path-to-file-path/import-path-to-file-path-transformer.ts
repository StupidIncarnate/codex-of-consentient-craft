/**
 * PURPOSE: Decides whether a precomputed resolved path is the real answer for an import path — a
 * relative import, or a workspace package's `./testing` subpath (per isProxyImportGuard) both
 * resolve; any other bare package specifier ('axios', '@testing-library/react') never does, no
 * matter what resolvedPath/fileExists claim, because only a workspace `./testing` barrel is ever
 * meant to hoist mocks across a package boundary.
 *
 * USAGE:
 * const filePath = importPathToFilePathTransformer({
 *   sourceFilePath: '/src/test.test.ts',
 *   importPath: './test.proxy',
 *   resolvedPath: '/src/test.proxy.ts',
 *   fileExists: true
 * });
 * // Returns '/src/test.proxy.ts' as FilePath or null if file doesn't exist
 */

import { isProxyImportGuard } from '../../guards/is-proxy-import/is-proxy-import-guard';

export const importPathToFilePathTransformer = ({
  importPath,
  resolvedPath,
  fileExists,
}: {
  sourceFilePath: string;
  importPath: string;
  resolvedPath: string;
  fileExists: boolean;
}): string | null => {
  const isResolvableSpecifier = importPath.startsWith('.') || isProxyImportGuard({ importPath });
  if (!isResolvableSpecifier) {
    return null;
  }

  if (fileExists) {
    return resolvedPath;
  }

  return null;
};
