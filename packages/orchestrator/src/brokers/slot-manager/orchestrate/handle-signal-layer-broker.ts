/**
 * PURPOSE: Handles agent signal types and updates work item status via WorkTracker
 *
 * USAGE:
 * const result = await handleSignalLayerBroker({signal, workItemId, workTracker, role});
 * // Returns HandleSignalResult to drive orchestration loop decisions
 */

import type { AgentRole } from '../../../contracts/agent-role/agent-role-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';

type SignalSummary = NonNullable<StreamSignal['summary']>;

// Static failure routing: role that failed → role that gets spawned
// Most failures route to pathseeker for replanning (drain+skip wipes pending items)
// Lawbringer routes to spiritmender (targeted code fix using same file paths)
// PathSeeker itself failing bubbles to the user (terminal)
const FAILURE_ROLE_MAP: Record<AgentRole, AgentRole | null> = {
  codeweaver: 'pathseeker',
  siegemaster: 'pathseeker',
  lawbringer: 'spiritmender',
  spiritmender: 'pathseeker',
  pathseeker: null,
};

type HandleSignalResult =
  | { action: 'continue' }
  | { action: 'spawn_role'; targetRole: AgentRole; summary?: SignalSummary }
  | { action: 'bubble_to_user'; summary?: SignalSummary };

export const handleSignalLayerBroker = async ({
  signal,
  workItemId,
  workTracker,
  role,
}: {
  signal: StreamSignal;
  workItemId?: WorkItemId;
  workTracker: WorkTracker;
  role: AgentRole;
}): Promise<HandleSignalResult> => {
  switch (signal.signal) {
    case 'complete': {
      if (workItemId) {
        await workTracker.markCompleted({ workItemId });
      }
      return { action: 'continue' };
    }

    case 'failed': {
      if (workItemId) {
        await workTracker.markFailed({ workItemId });
      }

      const targetRole = FAILURE_ROLE_MAP[role];

      if (targetRole === null) {
        return {
          action: 'bubble_to_user',
          ...(signal.summary === undefined ? {} : { summary: signal.summary }),
        };
      }

      return {
        action: 'spawn_role',
        targetRole,
        ...(signal.summary === undefined ? {} : { summary: signal.summary }),
      };
    }

    default: {
      const exhaustiveCheck: never = signal.signal;
      throw new Error(`Unhandled signal type: ${String(exhaustiveCheck)}`);
    }
  }
};
