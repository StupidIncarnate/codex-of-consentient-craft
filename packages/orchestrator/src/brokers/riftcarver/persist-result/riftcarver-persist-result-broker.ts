/**
 * PURPOSE: Writes one riftcarver attempt's streamed carve log to the quest folder, keyed by that
 * attempt's own result id. Reach for this over wardPersistResultBroker when the artifact is a plain
 * text log rather than ward's structured detail JSON — the execution panel renders it verbatim, so
 * the file extension and the absence of any JSON step are what separate the two. Each attempt owns a
 * fresh id, which is what makes a repaired carve accumulate a per-attempt history instead of
 * overwriting the attempt that failed.
 *
 * USAGE:
 * await riftcarverPersistResultBroker({
 *   questFolderPath: FilePathStub({ value: '/quests/001-add-auth' }),
 *   riftcarverResultId: RiftcarverResultStub().id,
 *   logContents: FileContentsStub({ value: '— build pass 1/3 —\n' }),
 * });
 * // Writes {questFolderPath}/riftcarver-results/{riftcarverResultId}.log
 */

import {
  adapterResultContract,
  filePathContract,
  type AdapterResult,
  type FileContents,
  type FilePath,
  type RiftcarverResult,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { ensureDir } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

const LOG_EXTENSION = '.log';

export const riftcarverPersistResultBroker = async ({
  questFolderPath,
  riftcarverResultId,
  logContents,
}: {
  questFolderPath: FilePath;
  riftcarverResultId: RiftcarverResult['id'];
  logContents: FileContents;
}): Promise<AdapterResult> => {
  const riftcarverResultsDir = filePathContract.parse(
    join(questFolderPath, locationsStatics.quest.riftcarverResultsDir),
  );

  await ensureDir(riftcarverResultsDir);

  const filePath = filePathContract.parse(
    join(riftcarverResultsDir, `${String(riftcarverResultId)}${LOG_EXTENSION}`),
  );

  await fsWriteFileAdapter({ filePath, contents: logContents });

  return adapterResultContract.parse({ success: true });
};
