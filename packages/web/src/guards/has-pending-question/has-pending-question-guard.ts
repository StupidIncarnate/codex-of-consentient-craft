/**
 * PURPOSE: Checks if the last tool_use entry in a chat is an AskUserQuestion with no subsequent user response
 *
 * USAGE:
 * hasPendingQuestionGuard({entries: chatEntries});
 * // Returns true if the last AskUserQuestion tool call has not been answered by the user
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

const ASK_USER_QUESTION_TOOL = 'mcp__dungeonmaster__ask-user-question';

export const hasPendingQuestionGuard = ({ entries }: { entries?: ChatEntry[] }): boolean => {
  if (!entries) return false;

  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];

    if (!entry) continue;

    if (entry.role === 'user') {
      return false;
    }

    if (
      entry.role === 'assistant' &&
      entry.type === 'tool_use' &&
      entry.toolName === ASK_USER_QUESTION_TOOL
    ) {
      return true;
    }
  }

  return false;
};
