/**
 * PURPOSE: Adapter for StartOrchestrator.bootstrap — starts the orchestrator's passive watchers
 * inside the HTTP server process. Called once at boot; the server-only dispatch-state
 * normalization is the separate orchestratorNormalizeDispatchBootAdapter.
 *
 * USAGE:
 * orchestratorBootstrapAdapter();
 * // Returns { success: true } once the watchers run; a repeat call is a no-op
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const orchestratorBootstrapAdapter = (): AdapterResult => StartOrchestrator.bootstrap();
