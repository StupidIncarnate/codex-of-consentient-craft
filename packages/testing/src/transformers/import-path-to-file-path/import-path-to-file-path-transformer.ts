/**
 * PURPOSE: Resolves a relative import path to an absolute file path
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

import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const importPathToFilePathTransformer = ({
  importPath,
  resolvedPath,
  fileExists,
}: {
  sourceFilePath: FilePath;
  importPath: ImportPath;
  resolvedPath: FilePath;
  fileExists: boolean;
}): FilePath | null => {
  if (!importPath.startsWith('.')) {
    return null;
  }

  if (fileExists) {
    return filePathContract.parse(resolvedPath);
  }

  return null;
};
