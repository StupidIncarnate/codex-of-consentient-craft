/**
 * PURPOSE: Resolves the quests directory path for a given project ID within ~/.dungeonmaster/projects/{projectId}/quests/
 *
 * USAGE:
 * const { questsPath } = await questResolveQuestsPathBroker({ projectId: ProjectIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: { questsPath: AbsoluteFilePath } pointing to ~/.dungeonmaster/projects/{projectId}/quests
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import type { AbsoluteFilePath, ProjectId } from '@dungeonmaster/shared/contracts';

export const questResolveQuestsPathBroker = ({
  projectId,
}: {
  projectId: ProjectId;
}): { questsPath: AbsoluteFilePath } => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const questsPath = pathJoinAdapter({
    paths: [
      homePath,
      dungeonmasterHomeStatics.paths.projectsDir,
      projectId,
      dungeonmasterHomeStatics.paths.questsDir,
    ],
  });

  return { questsPath: questsPath as AbsoluteFilePath };
};
