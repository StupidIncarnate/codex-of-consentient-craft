/**
 * PURPOSE: Checks if a chat entry is a tool entry (tool_use or tool_result from assistant)
 *
 * USAGE:
 * isToolEntryGuard({entry: chatEntry});
 * // Returns true if entry is a tool_use or tool_result
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

export const isToolEntryGuard = ({ entry }: { entry?: ChatEntry }): boolean => {
  if (entry === undefined) return false;

  return (
    entry.role === 'assistant' &&
    'type' in entry &&
    (entry.type === 'tool_use' || entry.type === 'tool_result')
  );
};
