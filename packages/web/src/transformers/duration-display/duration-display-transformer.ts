/**
 * PURPOSE: Computes a human-readable duration string from two ISO timestamps
 *
 * USAGE:
 * durationDisplayTransformer({startedAt, completedAt});
 * // Returns '12s' or '2m 34s' as DisplayLabel
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { DisplayLabel } from '../../contracts/display-label/display-label-contract';
import { displayLabelContract } from '../../contracts/display-label/display-label-contract';

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export const durationDisplayTransformer = ({
  startedAt,
  completedAt,
}: {
  startedAt: WorkItem['startedAt'];
  completedAt: WorkItem['completedAt'];
}): DisplayLabel => {
  const ms = new Date(String(completedAt)).getTime() - new Date(String(startedAt)).getTime();
  const totalSeconds = Math.floor(ms / MILLIS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const formatted = minutes > 0 ? `${String(minutes)}m ${String(seconds)}s` : `${String(seconds)}s`;
  return displayLabelContract.parse(formatted);
};
