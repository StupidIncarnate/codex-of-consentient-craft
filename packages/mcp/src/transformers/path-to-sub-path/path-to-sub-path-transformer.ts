/**
 * PURPOSE: Extracts the sub-path starting from a path anchor (src, test) for mirroring across scan roots
 *
 * USAGE:
 * pathToSubPathTransformer({ filepath: FilePathStub({ value: 'packages/orchestrator/src/contracts' }) });
 * // Returns FilePath 'src/contracts'
 *
 * WHEN-TO-USE: When mirroring a project path to a shared package scan path
 * WHEN-NOT-TO-USE: When the full path is needed without extraction
 */
import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const pathToSubPathTransformer = ({
  filepath,
}: {
  filepath?: FilePath;
}): FilePath | null => {
  if (!filepath) {
    return null;
  }

  const parts = filepath.split('/');

  for (const anchor of fileDiscoveryStatics.pathAnchors) {
    const anchorIndex = parts.indexOf(anchor);
    if (anchorIndex !== -1) {
      return filePathContract.parse(parts.slice(anchorIndex).join('/'));
    }
  }

  return null;
};
