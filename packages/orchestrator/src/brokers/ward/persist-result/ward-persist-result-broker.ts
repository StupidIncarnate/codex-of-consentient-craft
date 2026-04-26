/**
 * PURPOSE: Persists ward detail JSON to a quest's ward-results subdirectory
 *
 * USAGE:
 * await wardPersistResultBroker({ questFolderPath: FilePathStub(), wardResultId: 'run-123', detailJson: ErrorMessageStub() });
 * // Writes JSON to {questFolderPath}/ward-results/{wardResultId}.json
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  adapterResultContract,
  fileContentsContract,
  type AdapterResult,
  type ErrorMessage,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

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
  const wardResultsDir = pathJoinAdapter({
    paths: [questFolderPath, locationsStatics.quest.wardResultsDir],
  });

  await fsMkdirAdapter({ filepath: wardResultsDir });

  const filePath = pathJoinAdapter({
    paths: [wardResultsDir, wardResultId + JSON_EXTENSION],
  });

  const contents = fileContentsContract.parse(detailJson);

  await fsWriteFileAdapter({ filePath, contents });
  return adapterResultContract.parse({ success: true });
};
