/**
 * PURPOSE: Transforms debug session callback invocations into a record for the debug response
 *
 * USAGE:
 * buildCallbacksRecordTransformer({ invocations });
 * // Returns Record<CallbackKey, unknown[]> | undefined
 */
import type { CallbackKey } from '../../contracts/callback-key/callback-key-contract';
import { callbackKeyContract } from '../../contracts/callback-key/callback-key-contract';
import type { DebugSessionCallbackInvocations } from '../../contracts/debug-session-callback-invocations/debug-session-callback-invocations-contract';

export const buildCallbacksRecordTransformer = ({
  invocations,
}: {
  invocations: DebugSessionCallbackInvocations;
}): Record<CallbackKey, unknown[]> | undefined => {
  const callbacks: Record<CallbackKey, unknown[]> = {} as Record<CallbackKey, unknown[]>;

  if (invocations.onSpawnChaoswhisperer.length > 0) {
    callbacks[callbackKeyContract.parse('onSpawnChaoswhisperer')] =
      invocations.onSpawnChaoswhisperer;
  }
  if (invocations.onResumeChaoswhisperer.length > 0) {
    callbacks[callbackKeyContract.parse('onResumeChaoswhisperer')] =
      invocations.onResumeChaoswhisperer;
  }
  if (invocations.onRunQuest.length > 0) {
    callbacks[callbackKeyContract.parse('onRunQuest')] = invocations.onRunQuest;
  }
  if (invocations.onExit.length > 0) {
    callbacks[callbackKeyContract.parse('onExit')] = invocations.onExit;
  }

  return Object.keys(callbacks).length > 0 ? callbacks : undefined;
};
