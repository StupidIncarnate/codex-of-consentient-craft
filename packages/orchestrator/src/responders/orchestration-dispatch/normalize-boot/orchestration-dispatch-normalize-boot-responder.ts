/**
 * PURPOSE: Boot normalization for the dispatch state — rewrites a persisted 'node-playing' mode
 * to 'paused' (preserving the MCP heartbeat). A restarted server can't know whether in-flight
 * children survived, so the Node dispatcher never auto-plays across a restart.
 *
 * USAGE:
 * await OrchestrationDispatchNormalizeBootResponder();
 * // Returns the effective DispatchState after normalization
 *
 * WHEN-TO-USE: Called once from the HTTP server's StartServer boot — and ONLY there. Every MCP
 * stdio child also loads StartOrchestrator, and a child spawned while the Node dispatcher is
 * playing must NOT flip the shared file back to paused mid-run.
 * WHEN-NOT-TO-USE: Never from module-load bootstraps or request-scoped code.
 */

import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';

export const OrchestrationDispatchNormalizeBootResponder = async (): Promise<DispatchState> => {
  const current = await dispatchStateReadBroker();

  if (current.mode !== 'node-playing') {
    return current;
  }

  return dispatchStateWriteBroker({
    mode: 'paused',
    ...(current.mcpHeartbeatAt === undefined ? {} : { mcpHeartbeatAt: current.mcpHeartbeatAt }),
  });
};
