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
 *   logContents: '— build pass 1/3 —\n',
 * });
 * // Writes {questFolderPath}/riftcarver-results/{riftcarverResultId}.log
 */

import type { RiftcarverResult } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

const LOG_EXTENSION = '.log';

export const riftcarverPersistResultBroker = async ({
  questFolderPath,
  riftcarverResultId,
  logContents,
}: {
  questFolderPath: string;
  riftcarverResultId: RiftcarverResult['id'];
  logContents: string;
}): Promise<void> => {
  const riftcarverResultsDir = join(questFolderPath, locationsStatics.quest.riftcarverResultsDir);

  await ensureDir(riftcarverResultsDir);

  const filePath = join(riftcarverResultsDir, `${String(riftcarverResultId)}${LOG_EXTENSION}`);

  await writeFile(filePath, logContents);
};
