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
  currentFilePath?: string | undefined;
  importPath?: string | undefined;
}): boolean => {
  if (currentFilePath === undefined || importPath === undefined) {
    return false;
  }

  // Only check relative imports
  if (!importPath.startsWith('.')) {
    return false;
  }

  // Get the directory part of the current file path (remove the filename)
  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));

  // Resolve the import path relative to the current directory
  // Simple path resolution for relative imports - handles './' and '../' navigation
  const baseParts = currentDir.split('/').filter((p) => p !== '');
  const relParts = importPath.replace(/\.(ts|tsx|js|jsx)$/u, '').split('/');

  for (const part of relParts) {
    if (part === '..') {
      baseParts.pop();
    } else if (part !== '.' && part !== '') {
      baseParts.push(part);
    }
  }

  const resolvedImportPath = `/${baseParts.join('/')}.ts`;

  // Get directory of resolved import (remove filename)
  const resolvedDir = resolvedImportPath.substring(0, resolvedImportPath.lastIndexOf('/'));

  // Extract the full domain folder path after /src/ for current directory
  const currentSrcIndex = currentDir.indexOf('/src/');
  if (currentSrcIndex === -1) {
    return false;
  }

  const srcLength = 5; // Length of "/src/"
  const currentDomainPath = currentDir.substring(currentSrcIndex + srcLength);

  // Extract the full domain folder path after /src/ for resolved import directory
  const resolvedSrcIndex = resolvedDir.indexOf('/src/');
  if (resolvedSrcIndex === -1) {
    return false;
  }

  const importedDomainPath = resolvedDir.substring(resolvedSrcIndex + srcLength);

  // Compare the full domain folder paths
  return currentDomainPath === importedDomainPath;
};
