/**
 * PURPOSE: Pure function — given workItems[], return items ready to run plus terminal/blocked flags
 *
 * USAGE:
 * nextReadyWorkItemsTransformer({ workItems });
 * // Returns: { ready: WorkItem[], questTerminal: boolean, questBlocked: boolean }
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { NextReadyResult } from '../../contracts/next-ready-result/next-ready-result-contract';

const TERMINAL_STATUSES = new Set(['complete', 'failed', 'skipped']);
const SATISFIED_STATUSES = new Set(['complete']);

export const nextReadyWorkItemsTransformer = ({
  workItems,
}: {
  workItems: WorkItem[];
}): NextReadyResult => {
  if (workItems.length === 0) {
    return { ready: [], questTerminal: true, questBlocked: false };
  }

  const allTerminal = workItems.every((item) => TERMINAL_STATUSES.has(item.status));
  if (allTerminal) {
    return { ready: [], questTerminal: true, questBlocked: false };
  }

  const completedIds = new Set(
    workItems.filter((item) => SATISFIED_STATUSES.has(item.status)).map((item) => item.id),
  );

  const ready = workItems.filter(
    (item) => item.status === 'pending' && item.dependsOn.every((depId) => completedIds.has(depId)),
  );

  const anyInProgress = workItems.some((item) => item.status === 'in_progress');

  if (ready.length === 0 && !anyInProgress) {
    return { ready: [], questTerminal: false, questBlocked: true };
  }

  return { ready, questTerminal: false, questBlocked: false };
};
