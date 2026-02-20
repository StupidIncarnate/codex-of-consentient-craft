/**
 * PURPOSE: Resolves a single workspace glob pattern to a ProjectFolder array by reading subdirectories
 *
 * USAGE:
 * const folders = await workspaceDiscoverLayerPatternBroker({ pattern: 'packages/*', rootPath: AbsoluteFilePathStub() });
 * // Returns ProjectFolder[] for all matching directories that contain a valid package.json with a name
 */

import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { fsReaddirDirsAdapter } from '../../../adapters/fs/readdir-dirs/fs-readdir-dirs-adapter';
import { workspaceGlobStatics } from '../../../statics/workspace-glob/workspace-glob-statics';
import { workspaceDiscoverLayerReadBroker } from './workspace-discover-layer-read-broker';

export const workspaceDiscoverLayerPatternBroker = async ({
  pattern,
  rootPath,
}: {
  pattern: string;
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder[]> => {
  if (pattern.endsWith(workspaceGlobStatics.wildcardSuffix)) {
    const baseDir = pattern.slice(0, pattern.length - workspaceGlobStatics.wildcardSuffixLength);
    const basePath = filePathContract.parse(`${rootPath}/${baseDir}`);

    const dirNames = await fsReaddirDirsAdapter({ dirPath: basePath }).catch(() => null);
    if (dirNames === null) {
      return [];
    }

    const folders = await Promise.all(
      dirNames.map(async (entry) => {
        const fullPath = `${rootPath}/${baseDir}/${entry}`;
        return workspaceDiscoverLayerReadBroker({ fullPath, rootPath });
      }),
    );

    return folders.filter((f): f is ProjectFolder => f !== null);
  }

  const fullPath = `${rootPath}/${pattern}`;
  const folder = await workspaceDiscoverLayerReadBroker({ fullPath, rootPath });
  return folder === null ? [] : [folder];
};
