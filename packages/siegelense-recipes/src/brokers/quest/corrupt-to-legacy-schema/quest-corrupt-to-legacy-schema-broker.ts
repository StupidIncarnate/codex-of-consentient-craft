/**
 * PURPOSE: The quest ingredient's `corruptToLegacySchema` extra — overwrites an already-written
 * quest.json with one carrying a work item missing its `role`, so a caller can prove one bad
 * quest file does not take a whole guild's quest list down. Reach for this over trying to make
 * the `write` route itself produce an invalid row: the runner parses every route's return through
 * `record` (chunk 4's D3), so `questContract` would refuse the file before it ever reached disk —
 * this extra writes the corruption AFTER the create, straight to the file, bypassing that parse
 * entirely.
 *
 * USAGE:
 * await questCorruptToLegacySchemaBroker({ target, record: quest });
 * // Overwrites quest.json with workItems: [{ …no role… }]
 */
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questFolderPathResolveBroker } from '../folder-path-resolve/quest-folder-path-resolve-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const CORRUPT_WORK_ITEM = {
  id: 'corrupt-work-item',
  status: 'pending',
  spawnerType: 'agent',
  createdAt: '2024-01-15T10:00:00.000Z',
  relatedDataItems: [],
  dependsOn: [],
};

export const questCorruptToLegacySchemaBroker = async ({
  target,
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<AdapterResult> => {
  const questFolderPath = await questFolderPathResolveBroker({ target, record });
  const questFilePath = filePathContract.parse(
    `${questFolderPath}/${dungeonmasterHomeStatics.paths.questFile}`,
  );

  const corrupted = { ...record, workItems: [CORRUPT_WORK_ITEM] };

  return fsWriteFileAdapter({
    filePath: questFilePath,
    contents: fileContentsContract.parse(JSON.stringify(corrupted)),
  });
};
