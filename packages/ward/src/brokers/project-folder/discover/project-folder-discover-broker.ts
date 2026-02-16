/**
 * PURPOSE: Discovers all project folders by finding package.json files via git and extracting their names and paths
 *
 * USAGE:
 * const folders = await projectFolderDiscoverBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ProjectFolder[] with name and path for each discovered package
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { projectFolderDiscoverLayerReadBroker } from './project-folder-discover-layer-read-broker';

export const projectFolderDiscoverBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<ProjectFolder[]> => {
  const result = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      'package.json',
      '**/package.json',
    ],
    cwd: rootPath,
  });

  if (result.exitCode !== exitCodeContract.parse(0)) {
    return [];
  }

  const lines = result.output.trim();

  if (lines.length === 0) {
    return [];
  }

  const packageJsonPaths = lines.split('\n');

  const results = await Promise.all(
    packageJsonPaths.map(async (relativePath) =>
      projectFolderDiscoverLayerReadBroker({
        relativePath,
        rootPath,
      }),
    ),
  );

  return results.filter((folder): folder is ProjectFolder => folder !== null);
};
