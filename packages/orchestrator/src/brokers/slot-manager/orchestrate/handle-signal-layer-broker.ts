/**
 * PURPOSE: Handles agent signal types and updates work item status via WorkTracker
 *
 * USAGE:
 * const result = await handleSignalLayerBroker({signal, workItemId, workTracker});
 * // Returns HandleSignalResult to drive orchestration loop decisions
 */

import { agentRoleContract } from '../../../contracts/agent-role/agent-role-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { streamSignalContract } from '../../../contracts/stream-signal/stream-signal-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';

type SignalContinuationPoint = NonNullable<StreamSignal['continuationPoint']>;
type SignalTargetRole = NonNullable<StreamSignal['targetRole']>;
type SignalReason = NonNullable<StreamSignal['reason']>;
type SignalContext = NonNullable<StreamSignal['context']>;

type HandleSignalResult =
  | { action: 'continue' }
  | { action: 'respawn'; continuationPoint?: SignalContinuationPoint }
  | {
      action: 'spawn_role';
      targetRole: SignalTargetRole;
      reason?: SignalReason;
      context?: SignalContext;
    };

export const handleSignalLayerBroker = async ({
  signal,
  workItemId,
  workTracker,
}: {
  signal: StreamSignal;
  workItemId?: WorkItemId;
  workTracker: WorkTracker;
}): Promise<HandleSignalResult> => {
  switch (signal.signal) {
    case 'complete': {
      if (workItemId) {
        await workTracker.markCompleted({ workItemId });
      }
      return { action: 'continue' };
    }

    case 'partially-complete': {
      if (workItemId) {
        await workTracker.markPartiallyCompleted({ workItemId });
      }
      return {
        action: 'respawn',
        ...(signal.continuationPoint === undefined
          ? {}
          : { continuationPoint: signal.continuationPoint }),
      };
    }

    case 'needs-role-followup': {
      if (workItemId) {
        const parsedTargetRole = agentRoleContract.parse(signal.targetRole ?? 'spiritmender');
        await workTracker.markBlocked({
          workItemId,
          targetRole: parsedTargetRole,
        });
      }

      const defaultTargetRole = streamSignalContract.shape.targetRole.unwrap().parse('default');

      return {
        action: 'spawn_role',
        targetRole: signal.targetRole ?? defaultTargetRole,
        ...(signal.reason === undefined ? {} : { reason: signal.reason }),
        ...(signal.context === undefined ? {} : { context: signal.context }),
      };
    }

    default: {
      const exhaustiveCheck: never = signal.signal;
      throw new Error(`Unhandled signal type: ${String(exhaustiveCheck)}`);
    }
  }
};
