/**
 * PURPOSE: Pauses the Node dispatcher gracefully — persists mode 'paused' (preserving the MCP
 * heartbeat) and flips the in-memory mirror. The loop checks isPlaying() between steps, so
 * in-flight children finish and signal-back normally; nothing new dispatches.
 *
 * USAGE:
 * const state = await OrchestrationDispatchPauseResponder();
 * // Returns the persisted DispatchState with mode 'paused'
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';

export const OrchestrationDispatchPauseResponder = async (): Promise<DispatchState> => {
  const current = await dispatchStateReadBroker();

  const state = await dispatchStateWriteBroker({
    mode: 'paused',
    ...(current.mcpHeartbeatAt === undefined ? {} : { mcpHeartbeatAt: current.mcpHeartbeatAt }),
  });
  orchestrationDispatchState.setPlaying({ isPlaying: false });

  return state;
};
