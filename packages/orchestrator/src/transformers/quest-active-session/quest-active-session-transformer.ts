/**
 * PURPOSE: Derive the active chat session from work items (replaces questCreatedSessionBy/designSessionBy)
 *
 * USAGE:
 * questActiveSessionTransformer({ workItems });
 * // Returns: { sessionId: SessionId | undefined, role: WorkItemRole | undefined }
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
      const aTime = a.completedAt ?? a.createdAt;
      const bTime = b.completedAt ?? b.createdAt;
      return String(bTime).localeCompare(String(aTime));
    });

  const [mostRecent] = completedChats;
  if (mostRecent) {
    return { sessionId: mostRecent.sessionId, role: mostRecent.role };
  }

  return { sessionId: undefined, role: undefined };
};
