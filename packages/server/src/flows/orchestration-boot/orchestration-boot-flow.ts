/**
 * PURPOSE: Boots the orchestrator inside the HTTP server — starts its passive watchers, then
 * normalizes the Node-dispatcher state so a restarted server rewrites a persisted 'node-playing'
 * mode to 'paused' and never auto-plays. No HTTP routes — this is a side-effect-only flow. The
 * normalization runs ONLY in the HTTP server process; MCP children start the watchers through their
 * own boot flow but must never normalize the shared dispatch-state file.
 *
 * USAGE:
 * OrchestrationBootFlow.bootstrap();
 * // Side effect: watchers started synchronously, then fire-and-forget normalization
 */

import { OrchestrationBootstrapResponder } from '../../responders/orchestration/bootstrap/orchestration-bootstrap-responder';
import { OrchestrationDispatchNormalizeBootResponder } from '../../responders/orchestration/dispatch-normalize-boot/orchestration-dispatch-normalize-boot-responder';

const state: { ran: boolean } = { ran: false };

export const OrchestrationBootFlow = {
  bootstrap: (): void => {
    if (state.ran) return;
    state.ran = true;
    OrchestrationBootstrapResponder();
    OrchestrationDispatchNormalizeBootResponder().catch((error: unknown): void => {
      process.stderr.write(`[OrchestrationBootFlow.bootstrap] failed: ${String(error)}\n`);
    });
  },
};
