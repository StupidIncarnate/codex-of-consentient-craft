/**
 * PURPOSE: Starts the orchestrator's passive watchers when the MCP stdio child boots. The HTTP
 * server runs its own copy of this plus a dispatch-state normalization; this child runs the
 * watchers only.
 *
 * USAGE:
 * OrchestrationBootstrapResponder();
 * // Returns { success: true }; a repeat call is a no-op
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const OrchestrationBootstrapResponder = (): AdapterResult => StartOrchestrator.bootstrap();
