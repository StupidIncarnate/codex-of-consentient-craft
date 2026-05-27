/**
 * PURPOSE: Adapter for StartOrchestrator.findQuestBySessionId that wraps the orchestrator package
 *
 * USAGE:
 * const questId = await orchestratorFindQuestBySessionIdAdapter({ sessionId });
 * // Returns: QuestId of the quest whose chaoswhisperer workItem.sessionId matches, or null
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';

export const orchestratorFindQuestBySessionIdAdapter = async ({
  sessionId,
}: {
  sessionId: SessionId;
}): Promise<QuestId | null> => StartOrchestrator.findQuestBySessionId({ sessionId });
