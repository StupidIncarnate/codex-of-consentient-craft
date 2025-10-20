/**
 * Resolves a relative import path to an absolute path.
 * Used to determine the actual folder type of cross-folder imports.
 *
 * @example
 * // From: /src/brokers/rule/foo.ts
 * // Import: '../../../contracts/user'
 * // Returns: /src/contracts/user.ts
 */
export const filepathResolveRelativeImportTransformer = ({
  currentFilePath,
  importPath,
}: {
  currentFilePath: string;
  importPath: string;
}): string => {
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

  return `/${parts.join('/')}.ts`;
};
