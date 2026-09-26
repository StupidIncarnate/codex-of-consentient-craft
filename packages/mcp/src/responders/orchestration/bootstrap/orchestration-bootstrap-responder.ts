/**
 * PURPOSE: Starts the orchestrator's passive watchers when the MCP stdio child boots. The HTTP
 * server runs its own copy of this plus a dispatch-state normalization; this child runs the
 * watchers only.
 *
 * USAGE:
 * OrchestrationBootstrapResponder();
 * // Returns { success: true }; a repeat call is a no-op
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { orchestratorBootstrapAdapter } from '../../../adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter';

export const OrchestrationBootstrapResponder = (): AdapterResult => orchestratorBootstrapAdapter();
