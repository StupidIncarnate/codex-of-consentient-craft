/**
 * PURPOSE: Adapter for StartOrchestrator.stopAllChats that wraps the orchestrator package
 *
 * USAGE:
 * orchestratorStopAllChatsAdapter();
 * // Kills all active chat processes
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStopAllChatsAdapter = (): void => {
  StartOrchestrator.stopAllChats();
};
