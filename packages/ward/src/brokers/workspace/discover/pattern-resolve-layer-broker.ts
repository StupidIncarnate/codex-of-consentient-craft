/**
 * PURPOSE: Resolves a single workspace glob pattern to a ProjectFolder array by reading subdirectories
 *
 * USAGE:
 * const folders = await patternResolveLayerBroker({ pattern: 'packages/*', rootPath: AbsoluteFilePathStub() });
 * // Returns ProjectFolder[] for all matching directories that contain a valid package.json with a name
 */

import { readdirEntries } from '#gateway/node/fs__promises';

import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';
import { workspaceGlobStatics } from '../../../statics/workspace-glob/workspace-glob-statics';
import { packageReadLayerBroker } from './package-read-layer-broker';

export const patternResolveLayerBroker = async ({
  pattern,
  rootPath,
}: {
  pattern: string;
  rootPath: string;
}): Promise<ProjectFolder[]> => {
  if (pattern.endsWith(workspaceGlobStatics.wildcardSuffix)) {
    const baseDir = pattern.slice(0, pattern.length - workspaceGlobStatics.wildcardSuffixLength);
    const basePath = `${rootPath}/${baseDir}`;

    const entries = await readdirEntries(String(basePath)).catch(() => null);
    if (entries === null) {
      return [];
    }
    const dirNames = entries
      .filter((entry) => entry.kind === 'directory')
      .map((entry) => entry.name);

    const folders = await Promise.all(
      dirNames.map(async (entry) => {
        const fullPath = `${rootPath}/${baseDir}/${entry}`;
        return packageReadLayerBroker({ fullPath, rootPath });
      }),
    );

    return folders.filter((f) => f !== null).map((f) => projectFolderContract.parse(f));
  }

  const fullPath = `${rootPath}/${pattern}`;
  const folder = await packageReadLayerBroker({ fullPath, rootPath });
  return folder === null ? [] : [folder];
};
