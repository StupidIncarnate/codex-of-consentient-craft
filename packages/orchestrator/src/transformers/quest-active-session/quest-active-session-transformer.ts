/**
 * PURPOSE: Derive the active chat session from work items (replaces questCreatedSessionBy/designSessionBy)
 *
 * USAGE:
 * questActiveSessionTransformer({ workItems });
 * // Returns: { sessionId: SessionId | undefined, role: WorkItemRole | undefined }
 *
 * Resolution order:
 *   1. Active chaoswhisperer/glyphsmith chat work item with sessionId.
 *   2. Most-recent completed chaoswhisperer/glyphsmith with sessionId.
 *   3. Active non-chat work item with sessionId (covers smoketest quests that
 *      have no chat phase — codeweaver/etc work items expose their own sessions).
 *   4. Most-recent completed non-chat work item with sessionId.
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import { isActiveWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { ActiveSessionResult } from '../../contracts/active-session-result/active-session-result-contract';

const CHAT_ROLES = new Set(['chaoswhisperer', 'glyphsmith']);

export const questActiveSessionTransformer = ({
  workItems,
}: {
  workItems: WorkItem[];
}): ActiveSessionResult => {
  const activeChat = workItems.find(
    (wi) =>
      CHAT_ROLES.has(wi.role) &&
      isActiveWorkItemStatusGuard({ status: wi.status }) &&
      wi.sessionId !== undefined,
  );

  if (activeChat) {
    return { sessionId: activeChat.sessionId, role: activeChat.role };
  }

  const completedChats = workItems
    .filter((wi) => CHAT_ROLES.has(wi.role) && wi.sessionId !== undefined)
    .sort((a, b) => {
      const aTime = a.completedAt ?? a.startedAt ?? a.createdAt;
      const bTime = b.completedAt ?? b.startedAt ?? b.createdAt;
      return String(bTime).localeCompare(String(aTime));
    });

  const [mostRecentChat] = completedChats;
  if (mostRecentChat) {
    return { sessionId: mostRecentChat.sessionId, role: mostRecentChat.role };
  }

  const activeNonChat = workItems.find(
    (wi) =>
      !CHAT_ROLES.has(wi.role) &&
      isActiveWorkItemStatusGuard({ status: wi.status }) &&
      wi.sessionId !== undefined,
  );

  if (activeNonChat) {
    return { sessionId: activeNonChat.sessionId, role: activeNonChat.role };
  }

  const completedNonChats = workItems
    .filter((wi) => !CHAT_ROLES.has(wi.role) && wi.sessionId !== undefined)
    .sort((a, b) => {
      const aTime = a.completedAt ?? a.startedAt ?? a.createdAt;
      const bTime = b.completedAt ?? b.startedAt ?? b.createdAt;
      return String(bTime).localeCompare(String(aTime));
    });

  const [mostRecentNonChat] = completedNonChats;
  if (mostRecentNonChat) {
    return { sessionId: mostRecentNonChat.sessionId, role: mostRecentNonChat.role };
  }

  return { sessionId: undefined, role: undefined };
};
