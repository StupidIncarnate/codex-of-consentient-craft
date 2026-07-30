/**
 * PURPOSE: Maps a 1-based API-overload retry attempt number to how long the dispatcher should wait
 *   before that attempt — the tight tier first (the outage usually clears inside a few minutes),
 *   then the patient tier — or `null` once the schedule is spent and the death should be handed
 *   back to orphan recovery as a real crash.
 *
 * USAGE:
 * apiOverloadRetryDelayTransformer({ attempt: 1 });
 * // Returns 60000 (TimeoutMs) — attempts 1..fastAttempts wait one minute
 * apiOverloadRetryDelayTransformer({ attempt: 11 });
 * // Returns 300000 (TimeoutMs) — the next slowAttempts wait five minutes
 * apiOverloadRetryDelayTransformer({ attempt: 31 });
 * // Returns null — schedule exhausted
 */

import { timeoutMsContract } from '@dungeonmaster/shared/contracts';
import type { TimeoutMs } from '@dungeonmaster/shared/contracts';

import { apiOverloadRetryStatics } from '../../statics/api-overload-retry/api-overload-retry-statics';

export const apiOverloadRetryDelayTransformer = ({
  attempt,
}: {
  attempt: number;
}): TimeoutMs | null => {
  if (attempt < 1) {
    return null;
  }
  if (attempt <= apiOverloadRetryStatics.fastAttempts) {
    return timeoutMsContract.parse(apiOverloadRetryStatics.fastDelayMs);
  }
  if (attempt <= apiOverloadRetryStatics.fastAttempts + apiOverloadRetryStatics.slowAttempts) {
    return timeoutMsContract.parse(apiOverloadRetryStatics.slowDelayMs);
  }
  return null;
};
