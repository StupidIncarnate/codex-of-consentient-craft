/**
 * PURPOSE: Boots the Node-dispatcher state normalization at HTTP server startup — a restarted
 * server rewrites a persisted 'node-playing' dispatch mode to 'paused' so it never auto-plays.
 * No HTTP routes — this is a side-effect-only flow. It runs ONLY in the HTTP server process;
 * MCP children must never normalize the shared dispatch-state file.
 *
 * USAGE:
 * OrchestrationBootFlow.bootstrap();
 * // Side effect: fire-and-forget normalization via OrchestrationDispatchNormalizeBootResponder
 */

import { OrchestrationDispatchNormalizeBootResponder } from '../../responders/orchestration/dispatch-normalize-boot/orchestration-dispatch-normalize-boot-responder';

const state: { ran: boolean } = { ran: false };

export const OrchestrationBootFlow = {
  bootstrap: (): void => {
    if (state.ran) return;
    state.ran = true;
    OrchestrationDispatchNormalizeBootResponder().catch((error: unknown): void => {
      process.stderr.write(`[OrchestrationBootFlow.bootstrap] failed: ${String(error)}\n`);
    });
  },
};
