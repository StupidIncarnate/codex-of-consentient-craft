/**
 * PURPOSE: Attempts to start the Node dispatcher — runs the exclusivity gate (fresh MCP
 * heartbeat / in-flight Task-dispatched agents refuse; `force` overrides), persists
 * mode 'node-playing' on success, and flips the in-memory mirror (which kicks the runner via
 * the bootstrap's wake subscription).
 *
 * USAGE:
 * const response = await OrchestrationDispatchPlayResponder({});
 * // Returns { allowed: true, state } or { allowed: false, reason, state (unchanged) }
 */

import { dispatchStatePlayGateBroker } from '../../../brokers/dispatch-state/play-gate/dispatch-state-play-gate-broker';
import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';
import type { DispatchPlayResponse } from '../../../contracts/dispatch-play-response/dispatch-play-response-contract';
import { dispatchPlayResponseContract } from '../../../contracts/dispatch-play-response/dispatch-play-response-contract';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';

export const OrchestrationDispatchPlayResponder = async ({
  force,
}: {
  force?: boolean;
}): Promise<DispatchPlayResponse> => {
  const gate = await dispatchStatePlayGateBroker({
    ...(force === undefined ? {} : { force }),
  });

  const current = await dispatchStateReadBroker();

  if (!gate.allowed) {
    return dispatchPlayResponseContract.parse({
      allowed: false,
      ...(gate.reason === undefined ? {} : { reason: gate.reason }),
      state: current,
    });
  }

  const state = await dispatchStateWriteBroker({
    mode: 'node-playing',
    ...(current.mcpHeartbeatAt === undefined ? {} : { mcpHeartbeatAt: current.mcpHeartbeatAt }),
  });
  orchestrationDispatchState.setPlaying({ isPlaying: true });

  return dispatchPlayResponseContract.parse({ allowed: true, state });
};
