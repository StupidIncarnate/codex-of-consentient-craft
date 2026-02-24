/**
 * PURPOSE: Writes the extracted session ID back to the quest JSON file for session-quest correlation
 *
 * USAGE:
 * await questSessionWriteLayerBroker({ questId: 'my-quest', sessionId: SessionIdStub() });
 * // Reads quest.json, adds questCreatedSessionBy field, writes back
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { SessionId } from '@dungeonmaster/shared/contracts';
import {
  fileContentsContract,
  filePathContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questSessionWriteLayerBroker = async ({
  questId,
  sessionId,
}: {
  questId: string;
  sessionId: SessionId;
}): Promise<void> => {
  const parsedQuestId = questIdContract.parse(questId);
  const { questPath } = await questFindQuestPathBroker({ questId: parsedQuestId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
  );
  const contents = await fsReadFileAdapter({ filePath: questFilePath });
  const quest: unknown = JSON.parse(contents);

  if (typeof quest !== 'object' || quest === null) {
    return;
  }

  const updated = { ...quest, questCreatedSessionBy: sessionId };
  const updatedContents = fileContentsContract.parse(
    JSON.stringify(updated, null, JSON_INDENT_SPACES),
  );
  await fsWriteFileAdapter({ filePath: questFilePath, contents: updatedContents });
};
