/**
 * PURPOSE: Pure function — given workItems[], return items ready to run plus terminal/blocked flags
 *
 * USAGE:
 * nextReadyWorkItemsTransformer({ workItems });
 * // Returns: { ready: WorkItem[], questTerminal: boolean, questBlocked: boolean }
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isPendingWorkItemStatusGuard,
  isTerminalWorkItemStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import type { NextReadyResult } from '../../contracts/next-ready-result/next-ready-result-contract';

export const nextReadyWorkItemsTransformer = ({
  workItems,
}: {
  workItems: WorkItem[];
}): NextReadyResult => {
  if (workItems.length === 0) {
    return { ready: [], questTerminal: true, questBlocked: false };
  }

  const allTerminal = workItems.every((item) =>
    isTerminalWorkItemStatusGuard({ status: item.status }),
  );
  if (allTerminal) {
    return { ready: [], questTerminal: true, questBlocked: false };
  }

  const completedIds = new Set(
    workItems
      .filter((item) => satisfiesDependencyWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );

  const ready = workItems.filter(
    (item) =>
      isPendingWorkItemStatusGuard({ status: item.status }) &&
      item.dependsOn.every((depId) => completedIds.has(depId)),
  );

  const anyInProgress = workItems.some((item) =>
    isActiveWorkItemStatusGuard({ status: item.status }),
  );

  if (ready.length === 0 && !anyInProgress) {
    return { ready: [], questTerminal: false, questBlocked: true };
  }

  return { ready, questTerminal: false, questBlocked: false };
};
