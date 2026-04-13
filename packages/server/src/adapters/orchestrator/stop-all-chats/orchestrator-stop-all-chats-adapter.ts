/**
 * PURPOSE: Adapter for StartOrchestrator.stopAllChats that wraps the orchestrator package
 *
 * USAGE:
 * orchestratorStopAllChatsAdapter();
 * // Kills all active chat processes
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const orchestratorStopAllChatsAdapter = (): AdapterResult => {
  StartOrchestrator.stopAllChats();

  return { success: true as const };
};
