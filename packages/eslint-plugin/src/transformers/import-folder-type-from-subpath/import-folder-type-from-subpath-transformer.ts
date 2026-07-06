/**
 * PURPOSE: Extracts the folder type a cross-package import targets from its subpath — the first path
 * segment that names a folder type (e.g. '@scope/pkg/contracts' or 'pkg/adapters/x' → the folder).
 * Returns null for bare packages / root barrels with no folder-type segment.
 *
 * USAGE:
 * importFolderTypeFromSubpathTransformer({ importPath: '@dungeonmaster/shared/contracts' });
 * // Returns 'contracts'
 * importFolderTypeFromSubpathTransformer({ importPath: '@dungeonmaster/orchestrator' });
 * // Returns null
 */
import { folderTypeContract, type FolderType } from '@dungeonmaster/shared/contracts';

export const importFolderTypeFromSubpathTransformer = ({
  importPath,
}: {
  importPath: string;
}): FolderType | null => {
  const segments = importPath.split('/');

  for (const segment of segments) {
    const parsed = folderTypeContract.safeParse(segment);

    if (parsed.success) {
      return parsed.data;
    }
  }

  return null;
};
