/**
 * PURPOSE: True when two rate-limit snapshots differ in anything a reader would notice — the
 *   percentage or the reset of either window. Reach for this over comparing the snapshots whole:
 *   `updatedAt` is stamped from the clock on every pass, so a whole-object comparison reports a
 *   change every few seconds forever and the browser re-fetches on a timer it never asked for.
 *
 * USAGE:
 * hasRateLimitsSnapshotChangedGuard({ previous, next });
 * // Returns true when a window's reading moved, false when only the timestamp did
 */

import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

export const hasRateLimitsSnapshotChangedGuard = ({
  previous,
  next,
}: {
  previous?: RateLimitsSnapshot | null;
  next?: RateLimitsSnapshot | null;
}): boolean => {
  // A snapshot whose windows are BOTH null carries exactly what no snapshot carries: nothing a
  // card can draw. Treating the two as equal is what stops a fresh boot emitting one update that
  // tells the browser to re-fetch a reading that does not exist yet.
  const previousWindows =
    previous === null ||
    previous === undefined ||
    (previous.fiveHour === null && previous.sevenDay === null)
      ? null
      : previous;
  const nextWindows =
    next === null || next === undefined || (next.fiveHour === null && next.sevenDay === null)
      ? null
      : next;

  if (previousWindows === null || nextWindows === null) {
    return previousWindows !== nextWindows;
  }

  return (
    previousWindows.fiveHour?.usedPercentage !== nextWindows.fiveHour?.usedPercentage ||
    previousWindows.fiveHour?.resetsAt !== nextWindows.fiveHour?.resetsAt ||
    previousWindows.sevenDay?.usedPercentage !== nextWindows.sevenDay?.usedPercentage ||
    previousWindows.sevenDay?.resetsAt !== nextWindows.sevenDay?.resetsAt
  );
};
