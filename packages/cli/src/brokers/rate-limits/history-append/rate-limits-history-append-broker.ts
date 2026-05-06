/**
 * PURPOSE: Appends one RateLimitsHistoryLine to ~/.dungeonmaster/rate-limits-history.jsonl for future trajectory analysis
 *
 * USAGE:
 * await rateLimitsHistoryAppendBroker({ line });
 * // Appends the JSON-serialized line + '\n'. Day-1 nothing reads this; the file accumulates so a future projection feature has historical data after server restarts.
 *
 * TODO(history-rotation): bound size when projection consumer ships. ~17k lines/day at 5s throttle = ~2.5MB/day; rotation strategy TBD.
 */

import {
  fileContentsContract,
  filePathContract,
  type RateLimitsHistoryLine,
} from '@dungeonmaster/shared/contracts';
import { pathDirnameAdapter } from '@dungeonmaster/shared/adapters';
import { locationsRateLimitsHistoryPathFindBroker } from '@dungeonmaster/shared/brokers';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';

export const rateLimitsHistoryAppendBroker = async ({
  line,
}: {
  line: RateLimitsHistoryLine;
}): Promise<{ appended: true }> => {
  const historyPath = locationsRateLimitsHistoryPathFindBroker();
  const homeDir = pathDirnameAdapter({ path: filePathContract.parse(historyPath) });

  await fsMkdirAdapter({ filePath: homeDir });

  const contents = fileContentsContract.parse(`${JSON.stringify(line)}\n`);
  await fsAppendFileAdapter({ filePath: filePathContract.parse(historyPath), contents });

  return { appended: true };
};
