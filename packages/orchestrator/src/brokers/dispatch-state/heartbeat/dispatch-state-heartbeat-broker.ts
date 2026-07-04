/**
 * PURPOSE: Records that a /dumpster-launch loop just polled get-next-step — read-modify-writes
 * dispatch-state.json with mcpHeartbeatAt = now, preserving the current mode. The Node play gate
 * reads this heartbeat to refuse playing while an MCP loop is active.
 *
 * USAGE:
 * const state = await dispatchStateHeartbeatBroker();
 * // Returns the persisted DispatchState with a fresh mcpHeartbeatAt
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBroker } from '../read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../write/dispatch-state-write-broker';

export const dispatchStateHeartbeatBroker = async (): Promise<DispatchState> => {
  const current = await dispatchStateReadBroker();

  const heartbeatAt = dispatchStateContract.shape.mcpHeartbeatAt.parse(new Date().toISOString());

  return dispatchStateWriteBroker({
    mode: current.mode,
    mcpHeartbeatAt: heartbeatAt,
  });
};
