/**
 * PURPOSE: Persists quest file to disk atomically (temp+rename) then appends to the outbox for downstream notification
 *
 * USAGE:
 * await questPersistBroker({ questFilePath: FilePathStub({ value: '/quests/add-auth/quest.json' }), contents: FileContentsStub({ value: '{}' }), questId: QuestIdStub() });
 * // Writes file atomically (quest.json.tmp -> rename to quest.json) then appends outbox entry
 */

import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type {
  AdapterResult,
  FileContents,
  FilePath,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questOutboxAppendBroker } from '../outbox-append/quest-outbox-append-broker';

const TMP_SUFFIX = '.tmp';

export const questPersistBroker = async ({
  questFilePath,
  contents,
  questId,
}: {
  questFilePath: FilePath;
  contents: FileContents;
  questId: QuestId;
}): Promise<AdapterResult> => {
  const tmpPath = filePathContract.parse(`${questFilePath}${TMP_SUFFIX}`);

  await fsWriteFileAdapter({ filePath: tmpPath, contents });
  await fsRenameAdapter({ from: tmpPath, to: questFilePath });
  await questOutboxAppendBroker({ questId });
  return adapterResultContract.parse({ success: true });
};
