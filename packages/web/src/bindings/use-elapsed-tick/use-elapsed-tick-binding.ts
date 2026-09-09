/**
 * PURPOSE: Drives the live elapsed figure on every RUNNING work-item row from ONE shared interval,
 * held by the execution panel rather than by each row. A per-row interval starts counting from that
 * row's own mount time, so two items dispatched in the same batch — genuinely the same age — would
 * show elapsed figures up to a tick period apart purely from when each row happened to mount; one
 * shared `now` removes that skew, because every row diffs its own `startedAt` against the identical
 * instant. `enabled` lets the panel hold no interval at all once nothing is left running, rather
 * than every row independently deciding when to stop.
 *
 * USAGE:
 * const { now } = useElapsedTickBinding({ enabled: hasRunningRow });
 * // `now` is a fresh IsoTimestamp on mount, then again every elapsedDisplayConfigStatics.refresh.tickMs
 * // while enabled; each row diffs its own startedAt against it
 */

import { useEffect, useState } from 'react';

import { isoTimestampContract } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

export const useElapsedTickBinding = ({ enabled }: { enabled: boolean }): { now: IsoTimestamp } => {
  // The initialiser reads Date.now() synchronously on the FIRST render, rather than deferring to
  // the first tick — a row that mounts on a work item already 4 minutes old must read "4m"
  // immediately, not "0m" for up to a whole tick period until the interval below fires once.
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    setNowMs(Date.now());
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, elapsedDisplayConfigStatics.refresh.tickMs);

    return (): void => {
      clearInterval(id);
    };
  }, [enabled]);

  return { now: isoTimestampContract.parse(new Date(nowMs).toISOString()) };
};
