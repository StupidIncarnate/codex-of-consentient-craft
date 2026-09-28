/**
 * PURPOSE: Appends one RateLimitsHistoryLine to ~/.dungeonmaster/rate-limits-history.jsonl for future trajectory analysis
 *
 * USAGE:
 * await rateLimitsHistoryAppendBroker({ line });
 * // Appends the JSON-serialized line + '\n'. Day-1 nothing reads this; the file accumulates so a future projection feature has historical data after server restarts.
 *
 * TODO(history-rotation): bound size when projection consumer ships. ~17k lines/day at 5s throttle = ~2.5MB/day; rotation strategy TBD.
 */

import { dirname } from '#gateway/node/path';
import { appendFile, ensureDir } from '#gateway/node/fs__promises';
import {
  fileContentsContract,
  filePathContract,
  type RateLimitsHistoryLine,
} from '@dungeonmaster/shared/contracts';
import { locationsRateLimitsHistoryPathFindBroker } from '@dungeonmaster/shared/brokers';

export const rateLimitsHistoryAppendBroker = async ({
  line,
}: {
  line: RateLimitsHistoryLine;
}): Promise<{ appended: true }> => {
  const historyPath = locationsRateLimitsHistoryPathFindBroker();
  const homeDir = filePathContract.parse(dirname(historyPath));

  await ensureDir(homeDir);

  const contents = fileContentsContract.parse(`${JSON.stringify(line)}\n`);
  await appendFile(historyPath, contents);

  return { appended: true };
};
