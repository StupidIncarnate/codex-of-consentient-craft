/**
 * PURPOSE: Persists ward detail JSON to a quest's ward-results subdirectory
 *
 * USAGE:
 * await wardPersistResultBroker({ questFolderPath: FilePathStub(), wardResultId: 'run-123', detailJson: ErrorMessageStub() });
 * // Writes JSON to {questFolderPath}/ward-results/{wardResultId}.json
 */

import type { WardResult } from '@dungeonmaster/shared/contracts';
import {
  filePathContract,
  type ErrorMessage,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

const JSON_EXTENSION = '.json';

export const wardPersistResultBroker = async ({
  questFolderPath,
  wardResultId,
  detailJson,
}: {
  questFolderPath: FilePath;
  wardResultId: WardResult['id'];
  detailJson: ErrorMessage;
}): Promise<void> => {
  const wardResultsDir = filePathContract.parse(
    join(questFolderPath, locationsStatics.quest.wardResultsDir),
  );

  await ensureDir(wardResultsDir);

  const filePath = filePathContract.parse(join(wardResultsDir, wardResultId + JSON_EXTENSION));

  await writeFile(filePath, detailJson);
};
