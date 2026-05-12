/**
 * PURPOSE: Returns true when a chat entry counts as a "message" anchor for tail-window collapse — i.e. text content the user reads as prose, not a tool call or internal thinking
 *
 * USAGE:
 * isMessageAnchorEntryGuard({ entry: assistantTextEntry });
 * // true (assistant text is prose)
 * isMessageAnchorEntryGuard({ entry: assistantToolUseEntry });
 * // false (tool calls are noise, not anchors)
 * isMessageAnchorEntryGuard({ entry: assistantThinkingEntry });
 * // false (thinking is internal monologue, not anchor)
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const isMessageAnchorEntryGuard = ({ entry }: { entry?: ChatEntry }): boolean => {
  if (entry === undefined) {
    return false;
  }

  if (entry.role === 'user') {
    return true;
  }

  if (entry.role === 'system') {
    return true;
  }

  return entry.type === 'text';
};
