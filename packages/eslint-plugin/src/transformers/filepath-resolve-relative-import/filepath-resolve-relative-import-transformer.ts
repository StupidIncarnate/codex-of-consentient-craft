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
import { fileExtensionsStatics } from '@dungeonmaster/shared/statics';

export const filepathResolveRelativeImportTransformer = ({
  currentFilePath,
  importPath,
}: {
  currentFilePath: string;
  importPath: string;
}): FilePath => {
  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
  const parts = currentDir.split('/').filter((p) => p !== '');

  // Check if importPath has a known source extension and preserve it
  const originalExtension = fileExtensionsStatics.source.all.find((ext) =>
    importPath.endsWith(ext),
  );

  // Remove any extension from importPath and split by '/'
  const relParts = importPath.replace(/\.(ts|tsx|js|jsx)$/u, '').split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }

  // Use original extension if present, otherwise default to .ts
  const extension = originalExtension ?? '.ts';
  return filePathContract.parse(`/${parts.join('/')}${extension}`);
};
