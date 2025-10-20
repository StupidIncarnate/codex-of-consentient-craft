import { folderConfigTransformer } from '../../transformers/folder-config/folder-config-transformer';

/**
 * Determines if a file path represents an "entry file" that can be imported across domain folders.
 *
 * IMPORTANT: Requires the full file path to validate correctly. Without the full path,
 * we cannot determine if the file matches its domain/action folders.
 *
 * Entry files follow the naming convention based on folderDepth:
 * - Depth 0 (startup): Any .ts file
 * - Depth 1 (contracts, adapters, etc.): [name]-[suffix].ts (e.g., user-contract.ts)
 * - Depth 2 (brokers, responders): [domain]-[action]-[suffix].ts (e.g., user-fetch-broker.ts)
 *   AND must be in the matching folder structure (src/brokers/user/fetch/)
 *
 * Multi-dot files (.stub.ts, .mock.ts, .test.ts) are never entry files.
 */
export const isEntryFileGuard = ({
  filePath,
  folderType,
}: {
  filePath?: string | undefined;
  folderType?: string | undefined;
}): boolean => {
  // Early returns for undefined/invalid inputs
  if (filePath === undefined || folderType === undefined || folderType === '') {
    return false;
  }

  const basename = filePath.split('/').pop() ?? '';

  // Multi-dot files are never entry files (e.g., .stub.ts, .mock.ts, .test.ts)
  const dotCount = (basename.match(/\./gu) ?? []).length;
  if (dotCount > 1) {
    return false;
  }

  const config = folderConfigTransformer({ folderType });

  // Special case: startup folder allows any .ts file
  if (folderType === 'startup') {
    return true;
  }

  // Check if filename matches the expected suffix pattern
  if (!config?.fileSuffix) {
    return false;
  }
  const suffixes = Array.isArray(config.fileSuffix) ? config.fileSuffix : [config.fileSuffix];
  const hasSuffix = suffixes.some((suffix: string) => basename.endsWith(suffix));

  if (!hasSuffix) {
    return false;
  }

  // For ALL folder types, we need the full path to validate the filename matches the domain
  // If we don't have a full path (no slashes), we cannot validate
  if (!filePath.includes('/')) {
    return false;
  }

  if (config === undefined) {
    return false;
  }

  const suffixPattern: string = Array.isArray(config.fileSuffix)
    ? String(config.fileSuffix[0])
    : String(config.fileSuffix);

  // Extract domain folders from file path based on folderDepth
  const pathParts = filePath.split('/');

  // Find the category folder (contracts, brokers, etc.) in the path
  const categoryIndex = pathParts.findIndex((part) => part === folderType);

  if (categoryIndex === -1) {
    return false;
  }

  // Extract domain folder(s) based on depth
  const domainFolders: string[] = [];
  const maxDepth = config.folderDepth;
  let depthIndex = 1;

  while (depthIndex <= maxDepth) {
    const folderIndex = categoryIndex + depthIndex;
    if (folderIndex >= pathParts.length - 1) {
      return false;
    }
    const folder = pathParts[folderIndex];
    if (folder !== undefined) {
      domainFolders.push(folder);
    }
    depthIndex += 1;
  }

  // Build expected filename prefix from domain folders
  const expectedPrefix = domainFolders.join('-');

  // Extract actual prefix from filename by removing suffix
  const nameWithoutExt = basename.replace(/\.(ts|tsx)$/u, '');
  const suffixToRemove = suffixPattern.replace(/\.(ts|tsx)$/u, '');
  const actualPrefix = nameWithoutExt.replace(new RegExp(`${suffixToRemove}$`, 'u'), '');

  // Validate: actual prefix must match expected prefix
  return actualPrefix === expectedPrefix;
};
