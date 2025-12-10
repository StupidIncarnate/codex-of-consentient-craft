/**
 * PURPOSE: Finds the .dungeonmaster-quests folder at the project root
 *
 * USAGE:
 * await questsFolderFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to .dungeonmaster-quests folder
 */

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { projectRootFindBroker } from '../../project-root/find/project-root-find-broker';
import { questsFolderStatics } from '../../../statics/quests-folder/quests-folder-statics';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const questsFolderFindBroker = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<FilePath> => {
  const projectRoot = await projectRootFindBroker({ startPath });

  const questsFolderPath = pathJoinAdapter({
    paths: [projectRoot, questsFolderStatics.paths.root],
  });

  return questsFolderPath;
};
