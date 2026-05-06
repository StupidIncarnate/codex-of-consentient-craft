/**
 * PURPOSE: Polls ~/.dungeonmaster/rate-limits.json every intervalMs and invokes onSnapshot when it changes
 *
 * USAGE:
 * const handle = rateLimitsWatchBroker({
 *   intervalMs: 5000,
 *   onSnapshot: ({ snapshot }) => { ... },
 *   onError: ({ message }) => { process.stderr.write(message); },
 * });
 * handle.stop();
 * // Returns { stop } — call stop() to clearInterval. Tracks last-seen JSON to avoid no-op fires.
 */

import type { FileContents, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';
import { rateLimitsWatchTickLayerBroker } from './rate-limits-watch-tick-layer-broker';

const TICK_STATE: { lastJson: FileContents | null } = { lastJson: null };

export const rateLimitsWatchBroker = ({
  intervalMs,
  onSnapshot,
  onError,
}: {
  intervalMs: number;
  onSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }) => void;
  onError: ({ message }: { message: string }) => void;
}): { stop: () => void } => {
  TICK_STATE.lastJson = null;

  return timerSetIntervalAdapter({
    callback: (): void => {
      rateLimitsWatchTickLayerBroker({
        lastJson: TICK_STATE.lastJson,
        onSnapshot,
        onError,
      })
        .then((result) => {
          TICK_STATE.lastJson = result.lastJson;
        })
        .catch((error: unknown) => {
          onError({
            message: `rate-limits-watch tick error: ${error instanceof Error ? error.message : String(error)}`,
          });
        });
    },
    intervalMs,
  });
};
