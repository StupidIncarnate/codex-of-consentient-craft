/**
 * PURPOSE: Renders a millisecond duration as `status`'s own display string — the largest whole
 * unit that is at least 1, never a compound like `'1h 4m'` (`'2s'`, `'14m'`, `'9h'`, `'3d'`). Reach
 * for this at the one edge where duration arithmetic becomes text a person or a session reads;
 * every upstream broker keeps holding the raw millisecond count so it stays subtractable.
 *
 * USAGE:
 * elapsedRenderTransformer({ elapsedMs: 840_000 });
 * // Returns '14m' as branded ElapsedText
 */

import { elapsedTextContract } from '../../contracts/elapsed-text/elapsed-text-contract';
import type { ElapsedText } from '../../contracts/elapsed-text/elapsed-text-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export const elapsedRenderTransformer = ({ elapsedMs }: { elapsedMs: EpochMs }): ElapsedText => {
  const totalSeconds = Math.floor(elapsedMs / MS_PER_SECOND);
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return elapsedTextContract.parse(`${totalSeconds}s`);
  }

  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  if (totalMinutes < MINUTES_PER_HOUR) {
    return elapsedTextContract.parse(`${totalMinutes}m`);
  }

  const totalHours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  if (totalHours < HOURS_PER_DAY) {
    return elapsedTextContract.parse(`${totalHours}h`);
  }

  const totalDays = Math.floor(totalHours / HOURS_PER_DAY);
  return elapsedTextContract.parse(`${totalDays}d`);
};
