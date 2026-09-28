/**
 * PURPOSE: Persists ward detail JSON to a quest's ward-results subdirectory
 *
 * USAGE:
 * await wardPersistResultBroker({ questFolderPath: FilePathStub(), wardResultId: 'run-123', detailJson: ErrorMessageStub() });
 * // Writes JSON to {questFolderPath}/ward-results/{wardResultId}.json
 */

import {
  adapterResultContract,
  fileContentsContract,
  filePathContract,
  type AdapterResult,
  type ErrorMessage,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { ensureDir } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

const JSON_EXTENSION = '.json';

export const wardPersistResultBroker = async ({
  questFolderPath,
  wardResultId,
  detailJson,
}: {
  questFolderPath: FilePath;
  wardResultId: string;
  detailJson: ErrorMessage;
}): Promise<AdapterResult> => {
  const wardResultsDir = filePathContract.parse(
    join(questFolderPath, locationsStatics.quest.wardResultsDir),
  );

  await ensureDir(wardResultsDir);

  const filePath = filePathContract.parse(join(wardResultsDir, wardResultId + JSON_EXTENSION));

  const contents = fileContentsContract.parse(detailJson);

  await fsWriteFileAdapter({ filePath, contents });
  return adapterResultContract.parse({ success: true });
};
