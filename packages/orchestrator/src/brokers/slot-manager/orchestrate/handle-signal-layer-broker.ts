/**
 * PURPOSE: Handles agent signal types and updates quest step status accordingly
 *
 * USAGE:
 * const result = await handleSignalLayerBroker({signal, stepId, questFilePath});
 * // Returns SlotManagerResult or null to continue orchestration
 */

import type { FilePath, StepId } from '@dungeonmaster/shared/contracts';

import { blockingReasonContract } from '../../../contracts/blocking-reason/blocking-reason-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { streamSignalContract } from '../../../contracts/stream-signal/stream-signal-contract';
import { questUpdateStepBroker } from '../../quest/update-step/quest-update-step-broker';

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
  stepId,
  questFilePath,
}: {
  signal: StreamSignal;
  stepId: StepId;
  questFilePath: FilePath;
}): Promise<HandleSignalResult> => {
  const now = isoTimestampContract.parse(new Date().toISOString());

  switch (signal.signal) {
    case 'complete': {
      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: {
          status: 'complete',
          completedAt: now,
        },
      });
      return { action: 'continue' };
    }

    case 'partially-complete': {
      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: {
          status: 'partially_complete',
        },
      });
      return {
        action: 'respawn',
        ...(signal.continuationPoint === undefined
          ? {}
          : { continuationPoint: signal.continuationPoint }),
      };
    }

    case 'needs-role-followup': {
      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: {
          status: 'blocked',
          blockingType: 'needs_role_followup',
          blockingReason: blockingReasonContract.parse(signal.reason ?? 'Role followup needed'),
        },
      });

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
