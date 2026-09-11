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

export const rateLimitsWatchBroker = ({
  intervalMs,
  onSnapshot,
  onError,
}: {
  intervalMs: number;
  onSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }) => void;
  onError: ({ message }: { message: string }) => void;
}): { stop: () => void } => {
  // Per WATCHER, not per module. Two watchers in one process would otherwise read and write one
  // another's last-seen JSON, and each one's `stop()` would leave the other's state behind.
  const tickState: { lastJson: FileContents | null; isReading: boolean } = {
    lastJson: null,
    isReading: false,
  };

  return timerSetIntervalAdapter({
    callback: (): void => {
      // A tick READS A FILE and only writes `lastJson` once that read resolves, so two ticks that
      // overlap both compare against the value from before either started. Both then see the
      // content as new and both emit — the same snapshot delivered twice for one change. It takes
      // a read slower than the interval, which a 5s production cadence hides and a loaded machine
      // does not: this was measured as a doubled `rate-limits-updated` event in a whole-repo run.
      // Skipping a tick while one is in flight also bounds the poller to one open read.
      if (tickState.isReading) {
        return;
      }
      tickState.isReading = true;

      rateLimitsWatchTickLayerBroker({
        lastJson: tickState.lastJson,
        onSnapshot,
        onError,
      })
        .then((result) => {
          tickState.lastJson = result.lastJson;
        })
        .catch((error: unknown) => {
          onError({
            message: `rate-limits-watch tick error: ${error instanceof Error ? error.message : String(error)}`,
          });
        })
        .finally(() => {
          tickState.isReading = false;
        });
    },
    intervalMs,
  });
};
