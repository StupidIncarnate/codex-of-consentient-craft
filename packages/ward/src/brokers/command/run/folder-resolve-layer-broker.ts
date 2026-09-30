/**
 * PURPOSE: Reads package.json from a root path and returns a ProjectFolder for single-package mode
 *
 * USAGE:
 * const folder = await folderResolveLayerBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ProjectFolder with name from package.json or rootPath as fallback
 */

import { readFile } from '#gateway/node/fs__promises';

import {
  projectFolderContract,
  type ProjectFolder,
} from '../../../contracts/project-folder/project-folder-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';

export const folderResolveLayerBroker = async ({
  rootPath,
}: {
  rootPath: string;
}): Promise<ProjectFolder> => {
  const pkgPath = `${rootPath}/package.json`;
  try {
    const contents = await readFile(pkgPath);
    const parsed = packageJsonContract.parse(JSON.parse(contents));
    if (parsed.name !== undefined) {
      return projectFolderContract.parse({ name: String(parsed.name), path: rootPath });
    }
  } catch {
    // fall through to default
  }
  return projectFolderContract.parse({ name: rootPath, path: rootPath });
};
