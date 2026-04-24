/**
 * PURPOSE: Adapter for StartOrchestrator.getExecutionQueue that wraps the orchestrator package — returns the current cross-guild quest execution queue snapshot
 *
 * USAGE:
 * const entries = orchestratorGetQuestQueueAdapter();
 * // Returns: readonly QuestQueueEntry[]
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestQueueAdapter = (): readonly QuestQueueEntry[] =>
  StartOrchestrator.getExecutionQueue();
