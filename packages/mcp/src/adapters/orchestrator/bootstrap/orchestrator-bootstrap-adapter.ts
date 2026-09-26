/**
 * PURPOSE: Adapter for StartOrchestrator.bootstrap — starts the orchestrator's passive watchers
 * inside the MCP stdio child. Called once at boot. The dispatch-state normalization the HTTP server
 * also runs has no MCP counterpart on purpose: a child spawned mid-play must not reset it.
 *
 * USAGE:
 * orchestratorBootstrapAdapter();
 * // Returns { success: true } once the watchers run; a repeat call is a no-op
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const orchestratorBootstrapAdapter = (): AdapterResult => StartOrchestrator.bootstrap();
