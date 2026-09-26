/**
 * PURPOSE: Boots the orchestrator inside the MCP stdio child — starts its passive watchers. No
 * tools are registered here; this is a side-effect-only flow. It deliberately does NOT normalize
 * the dispatch state the way the HTTP server's boot flow does: a child spawned while the Node
 * dispatcher is playing must not flip the shared file back to paused.
 *
 * USAGE:
 * OrchestrationBootFlow.bootstrap();
 * // Returns { success: true }; a repeat call is a no-op
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { OrchestrationBootstrapResponder } from '../../responders/orchestration/bootstrap/orchestration-bootstrap-responder';

export const OrchestrationBootFlow = {
  bootstrap: (): AdapterResult => OrchestrationBootstrapResponder(),
};
