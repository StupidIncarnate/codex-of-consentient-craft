/**
 * PURPOSE: Creates a WorkTracker backed by quest file I/O for step-based orchestration phases
 *
 * USAGE:
 * const tracker = workTrackerQuestStepBroker({questFilePath, role: 'codeweaver'});
 * await tracker.markCompleted({workItemId});
 * // Returns WorkTracker that reads/writes quest steps as work items
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../../contracts/agent-role/agent-role-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import { workTrackerContract } from '../../../contracts/work-tracker/work-tracker-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';
import type { WorkUnit } from '../../../contracts/work-unit/work-unit-contract';
import { questUpdateStepBroker } from '../../quest/update-step/quest-update-step-broker';

export const workTrackerQuestStepBroker = ({
  questFilePath,
  role: _role,
}: {
  questFilePath: FilePath;
  role: AgentRole;
}): WorkTracker =>
  workTrackerContract.parse({
    getReadyWorkIds: (): WorkItemId[] => {
      throw new Error('getReadyWorkIds requires async quest load — use pre-load quest pattern');
    },

    getWorkUnit: (): WorkUnit => {
      throw new Error('getWorkUnit requires async quest load — use pre-load quest pattern');
    },

    markStarted: async ({ workItemId }: { workItemId: WorkItemId }): Promise<void> => {
      await questUpdateStepBroker({
        questFilePath,
        stepId: stepIdContract.parse(workItemId),
        updates: { status: 'in_progress' },
      });
    },

    markCompleted: async ({ workItemId }: { workItemId: WorkItemId }): Promise<void> => {
      await questUpdateStepBroker({
        questFilePath,
        stepId: stepIdContract.parse(workItemId),
        updates: { status: 'complete' },
      });
    },

    markFailed: async ({ workItemId }: { workItemId: WorkItemId }): Promise<void> => {
      await questUpdateStepBroker({
        questFilePath,
        stepId: stepIdContract.parse(workItemId),
        updates: { status: 'failed' },
      });
    },

    markPartiallyCompleted: async ({ workItemId }: { workItemId: WorkItemId }): Promise<void> => {
      await questUpdateStepBroker({
        questFilePath,
        stepId: stepIdContract.parse(workItemId),
        updates: { status: 'partially_complete' },
      });
    },

    markBlocked: async ({ workItemId }: { workItemId: WorkItemId }): Promise<void> => {
      await questUpdateStepBroker({
        questFilePath,
        stepId: stepIdContract.parse(workItemId),
        updates: { status: 'blocked' },
      });
    },

    isAllComplete: (): boolean => {
      throw new Error('isAllComplete requires async quest load — use pre-load quest pattern');
    },

    isAllTerminal: (): boolean => {
      throw new Error('isAllTerminal requires async quest load — use pre-load quest pattern');
    },

    getIncompleteIds: (): WorkItemId[] => {
      throw new Error('getIncompleteIds requires async quest load — use pre-load quest pattern');
    },

    getFailedIds: (): WorkItemId[] => {
      throw new Error('getFailedIds requires async quest load — use pre-load quest pattern');
    },

    addWorkItem: (): void => {
      throw new Error(
        'addWorkItem is not supported for quest-step work tracker — steps are managed via quest file',
      );
    },
  });
