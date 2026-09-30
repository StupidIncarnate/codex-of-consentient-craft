/**
 * PURPOSE: Persists quest file to disk atomically (temp+rename) then appends to the outbox for downstream notification
 *
 * USAGE:
 * await questPersistBroker({ questFilePath: FilePathStub({ value: '/quests/add-auth/quest.json' }), contents: FileContentsStub({ value: '{}' }), questId: QuestIdStub() });
 * // Writes file atomically (quest.json.tmp -> rename to quest.json) then appends outbox entry
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, FilePath, Quest } from '@dungeonmaster/shared/contracts';
import { rename, writeFile } from '#gateway/node/fs__promises';

import { questOutboxAppendBroker } from '../outbox-append/quest-outbox-append-broker';

const TMP_SUFFIX = '.tmp';

export const questPersistBroker = async ({
  questFilePath,
  contents,
  questId,
}: {
  questFilePath: FilePath;
  contents: FileContents;
  questId: Quest['id'];
}): Promise<void> => {
  const tmpPath = filePathContract.parse(`${questFilePath}${TMP_SUFFIX}`);

  await writeFile(tmpPath, contents);
  await rename(tmpPath, questFilePath);
  await questOutboxAppendBroker({ questId });
};
