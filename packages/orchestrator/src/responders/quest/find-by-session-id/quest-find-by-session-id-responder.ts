/**
 * PURPOSE: Responder that resolves a sessionId to its owning QuestId by delegating to questFindBySessionIdBroker
 *
 * USAGE:
 * const questId = await QuestFindBySessionIdResponder({ sessionId });
 * // Returns: QuestId of the quest whose chaoswhisperer workItem.sessionId matches, or null
 *
 * WHEN-TO-USE: Wired via StartOrchestrator.findQuestBySessionId so the HTTP server's
 *   GET /api/quests/by-session/:sessionId endpoint can resolve the hook's sessionId to a questId.
 */

import type { Quest, Session } from '@dungeonmaster/shared/contracts';

import { questFindBySessionIdBroker } from '../../../brokers/quest/find-by-session-id/quest-find-by-session-id-broker';

export const QuestFindBySessionIdResponder = async ({
  sessionId,
}: {
  sessionId: Session['id'];
}): Promise<Quest['id'] | null> => questFindBySessionIdBroker({ sessionId });
