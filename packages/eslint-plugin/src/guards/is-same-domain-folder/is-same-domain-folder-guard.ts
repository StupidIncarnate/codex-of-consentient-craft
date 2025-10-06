/**
 * Determines if an import is from the same domain folder as the current file.
 * Example: /project/src/adapters/fs/test.ts importing from "./adapter" -> true (same fs/ folder)
 * Example: /project/src/adapters/fs/test.ts importing from "../axios/adapter" -> false (different folder)
 * Example: /project/src/contracts/user/user-contract.ts importing from "../../guards/user/user-guard" -> false
 */
export const isSameDomainFolderGuard = ({
  currentFilePath,
  importPath,
}: {
  currentFilePath: string;
  importPath: string;
}): boolean => {
  // Only check relative imports
  if (!importPath.startsWith('.')) {
    return false;
  }

  // Get the directory part of the current file path (remove the filename)
  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));

  // Resolve the import path relative to the current directory
  const resolvedImportPath = resolvePath(currentDir, importPath);

  // Get directory of resolved import (remove filename)
  const resolvedDir = resolvedImportPath.substring(0, resolvedImportPath.lastIndexOf('/'));

  // Extract the full domain folder path after /src/
  const currentDomainPath = extractDomainPath(currentDir);
  const importedDomainPath = extractDomainPath(resolvedDir);

  if (currentDomainPath === null || importedDomainPath === null) {
    return false;
  }

  // Compare the full domain folder paths
  return currentDomainPath === importedDomainPath;
};

/**
 * Extracts the domain folder path from a full file path.
 * Example: /project/src/contracts/user/ -> contracts/user
 * Example: /project/src/adapters/fs/ -> adapters/fs
 */
const extractDomainPath = (filePath: string): string | null => {
  const srcIndex = filePath.indexOf('/src/');
  if (srcIndex === -1) {
    return null;
  }

  const afterSrc = filePath.substring(srcIndex + 5); // Skip "/src/"
  return afterSrc;
};

/**
 * Simple path resolution for relative imports.
 * Handles './' and '../' navigation.
 */
const resolvePath = (basePath: string, relativePath: string): string => {
  const parts = basePath.split('/').filter((p) => p !== '');

  // Remove any extension from relativePath and split by '/'
  const relParts = relativePath.replace(/\.(ts|tsx|js|jsx)$/u, '').split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }

  return `/${parts.join('/')}.ts`;
};
