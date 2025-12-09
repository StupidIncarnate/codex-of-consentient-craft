/**
 * PURPOSE: Resolves a relative import path to an absolute path
 *
 * USAGE:
 * const resolved = filepathResolveRelativeImportTransformer({
 *   currentFilePath: '/src/brokers/rule/foo.ts',
 *   importPath: '../../../contracts/user'
 * });
 * // Returns '/src/contracts/user.ts' as the resolved absolute path
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const filepathResolveRelativeImportTransformer = ({
  currentFilePath,
  importPath,
}: {
  currentFilePath: string;
  importPath: string;
}): FilePath => {
  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
  const parts = currentDir.split('/').filter((p) => p !== '');

  // Remove any extension from importPath and split by '/'
  const relParts = importPath.replace(/\.(ts|tsx|js|jsx)$/u, '').split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }

  return filePathContract.parse(`/${parts.join('/')}.ts`);
};
