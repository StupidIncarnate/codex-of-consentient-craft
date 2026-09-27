/**
 * PURPOSE: Finds the .dungeonmaster-quests folder at the project root
 *
 * USAGE:
 * await questsFolderFindBroker({startPath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns FilePath to .dungeonmaster-quests folder
 */

import { join } from '#gateway/node/path';
import { projectRootFindBroker } from '../../project-root/find/project-root-find-broker';
import { questsFolderStatics } from '../../../statics/quests-folder/quests-folder-statics';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

export const questsFolderFindBroker = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<FilePath> => {
  const projectRoot = await projectRootFindBroker({ startPath });

  const questsFolderPath = join(projectRoot, questsFolderStatics.paths.root);

  return filePathContract.parse(questsFolderPath);
};
