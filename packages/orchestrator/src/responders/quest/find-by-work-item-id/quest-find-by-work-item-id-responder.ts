/**
 * PURPOSE: Responder that resolves a workItemId to its owning QuestId by delegating to questFindByWorkItemIdBroker
 *
 * USAGE:
 * const questId = await QuestFindByWorkItemIdResponder({ workItemId });
 * // Returns: QuestId of the quest whose workItems[] contains workItemId, or null when no quest owns it
 *
 * WHEN-TO-USE: Wired via StartOrchestrator.findQuestByWorkItemId so the HTTP server's chat-output
 *   broadcaster can stamp questId on each outgoing WS payload.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { questFindByWorkItemIdBroker } from '../../../brokers/quest/find-by-work-item-id/quest-find-by-work-item-id-broker';

export const QuestFindByWorkItemIdResponder = async ({
  workItemId,
}: {
  workItemId: QuestWorkItemId;
}): Promise<QuestId | null> => questFindByWorkItemIdBroker({ workItemId });
