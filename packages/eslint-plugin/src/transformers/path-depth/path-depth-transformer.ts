import type { DepthCount } from '../../contracts/depth-count/depth-count-contract';
import { depthCountContract } from '../../contracts/depth-count/depth-count-contract';

export const pathDepthTransformer = ({ filePath }: { filePath: string }): DepthCount => {
  // Match pattern: src/[folder-type]/... (with optional leading slash or path prefix)
  const srcMatch = /(?:^|\/)src\/([^/]+)\/(.*)$/u.exec(filePath);

  // If no match (file not in src/[folder-type]/ structure), depth is 0
  if (!srcMatch) {
    return depthCountContract.parse(0);
  }

  const [, , pathAfterFolderType] = srcMatch;

  // If no captured group or path is just the filename (no slashes), depth is 0
  if (
    pathAfterFolderType === undefined ||
    pathAfterFolderType === '' ||
    !pathAfterFolderType.includes('/')
  ) {
    return depthCountContract.parse(0);
  }

  // Count the number of slashes before the filename
  // 'user/user-contract.ts' → 1 slash → 1 level deep
  // 'user/fetch/user-fetch-broker.ts' → 2 slashes → 2 levels deep
  const parts = pathAfterFolderType.split('/');

  // Depth is number of directories (total parts - 1 for the filename)
  return depthCountContract.parse(parts.length - 1);
};
