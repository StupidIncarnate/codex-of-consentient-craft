/**
 * PURPOSE: Starts the orchestrator's passive watchers at HTTP server boot. Runs before
 * OrchestrationDispatchNormalizeBootResponder, the server-only normalization, which stays separate
 * because MCP children also start these watchers but must never normalize.
 *
 * USAGE:
 * OrchestrationBootstrapResponder();
 * // Returns { success: true }; a repeat call is a no-op
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const OrchestrationBootstrapResponder = (): AdapterResult => StartOrchestrator.bootstrap();
