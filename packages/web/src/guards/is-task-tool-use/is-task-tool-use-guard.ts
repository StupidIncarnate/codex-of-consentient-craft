/**
 * PURPOSE: Checks if a chat entry is a Task tool_use with an agentId (sub-agent invocation)
 *
 * USAGE:
 * isTaskToolUseGuard({entry: chatEntry});
 * // Returns true if entry is a tool_use with toolName 'Task' and has agentId
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';

export const isTaskToolUseGuard = ({ entry }: { entry?: ChatEntry }): boolean => {
  if (entry === undefined) return false;

  return (
    entry.role === 'assistant' &&
    'type' in entry &&
    entry.type === 'tool_use' &&
    'toolName' in entry &&
    entry.toolName === 'Task' &&
    'agentId' in entry &&
    entry.agentId !== undefined
  );
};
