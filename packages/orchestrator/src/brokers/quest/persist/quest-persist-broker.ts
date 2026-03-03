/**
 * PURPOSE: Persists quest file to disk then appends to the outbox for downstream notification
 *
 * USAGE:
 * await questPersistBroker({ questFilePath: FilePathStub({ value: '/quests/add-auth/quest.json' }), contents: FileContentsStub({ value: '{}' }), questId: QuestIdStub() });
 * // Writes file then appends outbox entry
 */

import type { FileContents, FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questOutboxAppendBroker } from '../outbox-append/quest-outbox-append-broker';

export const questPersistBroker = async ({
  questFilePath,
  contents,
  questId,
}: {
  questFilePath: FilePath;
  contents: FileContents;
  questId: QuestId;
}): Promise<void> => {
  await fsWriteFileAdapter({ filePath: questFilePath, contents });
  await questOutboxAppendBroker({ questId });
};
