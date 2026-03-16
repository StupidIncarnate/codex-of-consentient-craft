/**
 * PURPOSE: Transforms a list of work units into an in-memory WorkTracker with lifecycle management
 *
 * USAGE:
 * const tracker = workUnitsToWorkTrackerTransformer({workUnits, maxRetries: 2});
 * const readyIds = tracker.getReadyWorkIds();
 * // Returns WorkTracker backed by an in-memory Map for tracking work item status
 */

import { failCountContract } from '../../contracts/fail-count/fail-count-contract';
import type { FailCount } from '../../contracts/fail-count/fail-count-contract';
import type { WorkItemEntry } from '../../contracts/work-item-entry/work-item-entry-contract';
import type { WorkItemId } from '../../contracts/work-item-id/work-item-id-contract';
import { workItemIdContract } from '../../contracts/work-item-id/work-item-id-contract';
import { workTrackerContract } from '../../contracts/work-tracker/work-tracker-contract';
import type { WorkTracker } from '../../contracts/work-tracker/work-tracker-contract';
import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';

export const workUnitsToWorkTrackerTransformer = ({
  workUnits,
  maxRetries,
}: {
  workUnits: WorkUnit[];
  maxRetries?: FailCount;
}): WorkTracker => {
  const items = new Map<WorkItemId, WorkItemEntry>();
  const effectiveMaxRetries = maxRetries ?? failCountContract.parse(0);

  for (const [index, workUnit] of workUnits.entries()) {
    const workItemId = workItemIdContract.parse(`work-item-${String(index)}`);
    items.set(workItemId, { workUnit, status: 'pending', retryCount: failCountContract.parse(0) });
  }

  return workTrackerContract.parse({
    getReadyWorkIds: (): WorkItemId[] => {
      const result: WorkItemId[] = [];
      for (const [id, entry] of items) {
        if (entry.status === 'pending') {
          result.push(id);
        }
      }
      return result;
    },

    getWorkUnit: ({ workItemId }: { workItemId: WorkItemId }): WorkUnit => {
      const entry = items.get(workItemId);
      if (!entry) {
        throw new Error(`Work item not found: ${workItemId}`);
      }
      return entry.workUnit;
    },

    markStarted: ({ workItemId }: { workItemId: WorkItemId }): void => {
      const entry = items.get(workItemId);
      if (!entry) {
        throw new Error(`Work item not found: ${workItemId}`);
      }
      entry.status = 'started';
    },

    markCompleted: ({ workItemId }: { workItemId: WorkItemId }): void => {
      const entry = items.get(workItemId);
      if (!entry) {
        throw new Error(`Work item not found: ${workItemId}`);
      }
      entry.status = 'completed';
    },

    markFailed: ({ workItemId }: { workItemId: WorkItemId }): void => {
      const entry = items.get(workItemId);
      if (!entry) {
        throw new Error(`Work item not found: ${workItemId}`);
      }
      if (entry.retryCount < effectiveMaxRetries) {
        entry.retryCount = failCountContract.parse(Number(entry.retryCount) + 1);
        entry.status = 'pending';
      } else {
        entry.status = 'failed';
      }
    },

    isAllComplete: (): boolean => {
      for (const entry of items.values()) {
        if (entry.status !== 'completed') {
          return false;
        }
      }
      return true;
    },

    isAllTerminal: (): boolean => {
      for (const entry of items.values()) {
        if (
          entry.status !== 'completed' &&
          entry.status !== 'failed' &&
          entry.status !== 'skipped'
        ) {
          return false;
        }
      }
      return true;
    },

    getIncompleteIds: (): WorkItemId[] => {
      const result: WorkItemId[] = [];
      for (const [id, entry] of items) {
        if (
          entry.status !== 'completed' &&
          entry.status !== 'failed' &&
          entry.status !== 'skipped'
        ) {
          result.push(id);
        }
      }
      return result;
    },

    getFailedIds: (): WorkItemId[] => {
      const result: WorkItemId[] = [];
      for (const [id, entry] of items) {
        if (entry.status === 'failed') {
          result.push(id);
        }
      }
      return result;
    },

    addWorkItem: ({
      workItemId,
      workUnit,
    }: {
      workItemId: WorkItemId;
      workUnit: WorkUnit;
    }): void => {
      items.set(workItemId, {
        workUnit,
        status: 'pending',
        retryCount: failCountContract.parse(0),
      });
    },

    skipAllPending: (): void => {
      for (const entry of items.values()) {
        if (entry.status === 'pending') {
          entry.status = 'skipped';
        }
      }
    },
  });
};
