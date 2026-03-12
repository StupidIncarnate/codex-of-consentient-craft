/**
 * PURPOSE: Writes the extracted session ID to the quest's designSessionBy field for design session correlation
 *
 * USAGE:
 * await designSessionWriteLayerBroker({ questId: 'my-quest', sessionId: SessionIdStub() });
 * // Reads quest.json, adds designSessionBy field, writes back
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { questStatics } from '../../../statics/quest/quest-statics';
import { questPersistBroker } from '../../quest/persist/quest-persist-broker';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';

const QUEST_FILE_NAME = 'quest.json';

export const designSessionWriteLayerBroker = async ({
  questId,
  sessionId,
}: {
  questId: QuestId;
  sessionId: SessionId;
}): Promise<void> => {
  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
  );
  const contents = await fsReadFileAdapter({ filePath: questFilePath });
  const quest: unknown = JSON.parse(contents);

  if (typeof quest !== 'object' || quest === null) {
    return;
  }

  const updated = { ...quest, designSessionBy: sessionId };
  const updatedContents = fileContentsContract.parse(
    JSON.stringify(updated, null, questStatics.json.indentSpaces),
  );
  await questPersistBroker({ questFilePath, contents: updatedContents, questId });
};
