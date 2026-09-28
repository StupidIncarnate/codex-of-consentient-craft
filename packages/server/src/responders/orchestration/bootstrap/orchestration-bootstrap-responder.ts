/**
 * PURPOSE: Starts the orchestrator's passive watchers at HTTP server boot. Runs before
 * OrchestrationDispatchNormalizeBootResponder, the server-only normalization, which stays separate
 * because MCP children also start these watchers but must never normalize.
 *
 * USAGE:
 * OrchestrationBootstrapResponder();
 * // A repeat call is a no-op
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const OrchestrationBootstrapResponder = (): void => {
  StartOrchestrator.bootstrap();
};
