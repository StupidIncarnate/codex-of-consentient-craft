/**
 * PURPOSE: Starts the orchestrator's passive watchers at HTTP server boot. Runs before
 * OrchestrationDispatchNormalizeBootResponder, the server-only normalization, which stays separate
 * because MCP children also start these watchers but must never normalize.
 *
 * USAGE:
 * OrchestrationBootstrapResponder();
 * // Returns { success: true }; a repeat call is a no-op
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { orchestratorBootstrapAdapter } from '../../../adapters/orchestrator/bootstrap/orchestrator-bootstrap-adapter';

export const OrchestrationBootstrapResponder = (): AdapterResult => orchestratorBootstrapAdapter();
