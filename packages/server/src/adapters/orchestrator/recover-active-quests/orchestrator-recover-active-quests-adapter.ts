/**
 * PURPOSE: Adapter for StartOrchestrator.recoverActiveQuests that wraps the orchestrator package
 *
 * USAGE:
 * const recoveredIds = await orchestratorRecoverActiveQuestsAdapter();
 * // Returns array of quest IDs that were recovered
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorRecoverActiveQuestsAdapter = async (): Promise<QuestId[]> =>
  StartOrchestrator.recoverActiveQuests();
