/**
 * PURPOSE: Adapter for StartOrchestrator.getOrchestrationMode that wraps the orchestrator package —
 * returns the declared orchestrationMode (claude | node) from `.dungeonmaster.json`
 *
 * USAGE:
 * const mode = await orchestratorGetOrchestrationModeAdapter();
 * // Returns: OrchestrationMode
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';

export const orchestratorGetOrchestrationModeAdapter = async (): Promise<OrchestrationMode> =>
  StartOrchestrator.getOrchestrationMode();
