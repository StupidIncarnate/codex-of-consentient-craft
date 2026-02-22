/**
 * PURPOSE: Finds the workspace root by walking up from process.cwd() looking for a package.json with workspaces field
 *
 * USAGE:
 * const root = await workspaceRootFindBroker();
 * // Returns FilePath to the monorepo root, or process.cwd() for single-package projects
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathDirnameAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract as sharedFilePathContract } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const workspaceRootFindBroker = async ({
  currentPath,
}: {
  currentPath?: FilePath;
} = {}): Promise<FilePath> => {
  const searchPath = currentPath
    ? sharedFilePathContract.parse(currentPath)
    : sharedFilePathContract.parse(process.cwd());
  const packageJsonPath = pathJoinAdapter({ paths: [searchPath, 'package.json'] });

  try {
    const contents = await fsReadFileAdapter({ filepath: filePathContract.parse(packageJsonPath) });
    const parsed: unknown = JSON.parse(contents);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'workspaces' in parsed &&
      Array.isArray(Reflect.get(parsed, 'workspaces'))
    ) {
      return filePathContract.parse(searchPath);
    }
  } catch {
    // package.json doesn't exist or can't be read at this level
  }

  const parentPath = pathDirnameAdapter({ path: searchPath });
  if (parentPath === searchPath) {
    // Reached filesystem root without finding workspaces - fall back to cwd
    return filePathContract.parse(process.cwd());
  }

  return workspaceRootFindBroker({ currentPath: filePathContract.parse(parentPath) });
};
