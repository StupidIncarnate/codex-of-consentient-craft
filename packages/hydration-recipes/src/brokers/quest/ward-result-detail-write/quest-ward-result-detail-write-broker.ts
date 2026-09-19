/**
 * PURPOSE: The quest ingredient's `withWardResultDetail` extra — writes a ward result's full
 * detail blob to its sibling file, `<questFolder>/ward-results/<wardResultId>.json`. Reach for
 * this over adding the detail onto `quest.json` itself: survey finding 3 is that a ward result's
 * SUMMARY lives in `quest.wardResults[]` and its DETAIL lives in this sibling file — one logical
 * entity across two storage locations, and this extra is the half `fields`/`record` cannot reach.
 *
 * USAGE:
 * await questWardResultDetailWriteBroker({ target, record: quest, args: { wardResultId, detail } });
 * // Writes <questFolder>/ward-results/<wardResultId>.json
 */
import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questFolderPathResolveBroker } from '../folder-path-resolve/quest-folder-path-resolve-broker';
import { wardResultDetailArgsContract } from '../../../contracts/ward-result-detail-args/ward-result-detail-args-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questWardResultDetailWriteBroker = async ({
  target,
  record,
  args,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
  args: Record<string, unknown>;
}): Promise<AdapterResult> => {
  const parsedArgs = wardResultDetailArgsContract.parse(args);
  const questFolderPath = await questFolderPathResolveBroker({ target, record });
  const wardResultsDirPath = `${questFolderPath}/${locationsStatics.quest.wardResultsDir}`;

  await fsMkdirAdapter({ filepath: filePathContract.parse(wardResultsDirPath) });

  return fsWriteFileAdapter({
    filePath: filePathContract.parse(`${wardResultsDirPath}/${parsedArgs.wardResultId}.json`),
    contents: fileContentsContract.parse(JSON.stringify(parsedArgs.detail)),
  });
};
