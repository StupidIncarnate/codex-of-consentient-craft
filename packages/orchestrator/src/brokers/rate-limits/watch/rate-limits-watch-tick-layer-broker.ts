/**
 * PURPOSE: One read-parse-emit cycle of the rate-limits.json poller — invoked by the watch broker on each interval tick
 *
 * USAGE:
 * const result = await rateLimitsWatchTickLayerBroker({ lastJson, onSnapshot, onError });
 * // Returns { outcome, lastJson } so the watch broker can thread state to the next tick without mutation.
 */

import { fileContentsContract, rateLimitsSnapshotContract, type FileContents, type RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';
import { locationsRateLimitsSnapshotPathFindBroker } from '@dungeonmaster/shared/brokers';
import { readFileIfExists } from '#gateway/node/fs__promises';

import {
  rateLimitsWatchTickResultContract,
  type RateLimitsWatchTickResult,
} from '../../../contracts/rate-limits-watch-tick-result/rate-limits-watch-tick-result-contract';

export const rateLimitsWatchTickLayerBroker = async ({
  lastJson,
  onSnapshot,
  onError,
}: {
  lastJson: FileContents | null;
  onSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }) => void;
  onError: ({ message }: { message: string }) => void;
}): Promise<RateLimitsWatchTickResult> => {
  const path = locationsRateLimitsSnapshotPathFindBroker();

  const result = await readFileIfExists(path).catch((error: unknown) => {
    onError({
      message: `rate-limits-watch read error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return 'error' as const;
  });

  if (result === null) {
    if (lastJson !== null) {
      onSnapshot({ snapshot: null });
      return rateLimitsWatchTickResultContract.parse({ outcome: 'cleared', lastJson: null });
    }
    return rateLimitsWatchTickResultContract.parse({ outcome: 'unchanged', lastJson: null });
  }

  if (result === 'error') {
    return rateLimitsWatchTickResultContract.parse({ outcome: 'error', lastJson });
  }

  if (result === lastJson) {
    return rateLimitsWatchTickResultContract.parse({ outcome: 'unchanged', lastJson });
  }

  const parsedContents = fileContentsContract.parse(result);

  try {
    const parsed = JSON.parse(result) as unknown;
    const snapshot = rateLimitsSnapshotContract.parse(parsed);
    onSnapshot({ snapshot });
    return rateLimitsWatchTickResultContract.parse({
      outcome: 'changed',
      lastJson: parsedContents,
    });
  } catch (error: unknown) {
    onError({
      message: `rate-limits-watch parse error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return rateLimitsWatchTickResultContract.parse({ outcome: 'error', lastJson: parsedContents });
  }
};
