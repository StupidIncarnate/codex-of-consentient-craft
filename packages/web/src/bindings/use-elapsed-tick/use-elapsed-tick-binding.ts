/**
 * PURPOSE: Drives the live elapsed figure on every RUNNING work-item row from ONE shared interval,
 * held by the execution panel rather than by each row. A per-row interval starts counting from that
 * row's own mount time, so two items dispatched in the same batch — genuinely the same age — would
 * show elapsed figures up to a tick period apart purely from when each row happened to mount; one
 * shared `now` removes that skew, because every row diffs its own `startedAt` against the identical
 * instant. `enabled` lets the panel hold no interval at all once nothing is left running, rather
 * than every row independently deciding when to stop.
 *
 * A backgrounded tab's `setInterval` is throttled or fully suspended by the browser's own power
 * policy, so the scheduled tick can silently miss its period for well over its `tickMs` while the
 * tab is hidden. A `visibilitychange` listener that fires only on the transition TO visible
 * resyncs `now` the instant the user returns, rather than leaving it pinned to whatever `now` the
 * last successful tick produced until the next scheduled fire.
 *
 * USAGE:
 * const { now } = useElapsedTickBinding({ enabled: hasRunningRow });
 * // `now` is a fresh IsoTimestamp on mount, then again every elapsedDisplayConfigStatics.refresh.tickMs
 * // while enabled, and immediately on refocus after a background suspension; each row diffs its own
 * // startedAt against it
 */

import { useCallback, useEffect, useState } from 'react';

import { isoTimestampContract } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

export const useElapsedTickBinding = ({ enabled }: { enabled: boolean }): { now: IsoTimestamp } => {
  // The initialiser reads Date.now() synchronously on the FIRST render, rather than deferring to
  // the first tick — a row that mounts on a work item already 4 minutes old must read "4m"
  // immediately, not "0m" for up to a whole tick period until the interval below fires once.
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Only the transition TO visible resyncs — a fire on hide would just relabel the same stale
  // instant the interval was about to produce anyway, since nobody is looking at it while hidden.
  const handleVisibilityChange = useCallback((): void => {
    if (!document.hidden) {
      setNowMs(Date.now());
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    setNowMs(Date.now());
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, elapsedDisplayConfigStatics.refresh.tickMs);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return (): void => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleVisibilityChange]);

  return { now: isoTimestampContract.parse(new Date(nowMs).toISOString()) };
};
