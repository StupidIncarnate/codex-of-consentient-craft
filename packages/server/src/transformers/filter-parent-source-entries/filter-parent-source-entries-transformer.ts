/**
 * PURPOSE: Filters a ChatEntry[] for the broadcaster: subagent-source entries pass through unchanged, and session-source (parent /dumpster-launch dispatcher) entries are dropped UNLESS they are a Task/Agent tool_use OR a user.tool_result whose toolName matches a previously-seen Task toolUseId
 *
 * USAGE:
 * const filtered = filterParentSourceEntriesTransformer({ entries, taskToolUseIds });
 * // Returns: ChatEntry[] — the surviving entries; the `taskToolUseIds` set is mutated in place with any new Task toolUseIds discovered this call
 *
 * The parent /dumpster-launch session is a dispatcher, not a speaker. Its narration text,
 * `get-next-step` tool_use calls, and similar dispatch-control chatter are suppressed from
 * the WS bus. Only Task() dispatches (Task / Agent tool_use) and the matching tool_result
 * that closes them are forwarded — that gives the web UI the sub-agent chain headers without
 * the dispatcher's verbose internal state.
 *
 * Tool_result correlation: per the orchestrator's chat-line-process-transformer convergence,
 * a user.tool_result content item is shipped as an assistant `tool_result` ChatEntry whose
 * `toolName` field carries the original `tool_use_id`. We match that against the Task ids we
 * recorded earlier in the same session, so only Task completions survive — other tool_results
 * (Read, Bash, etc.) are dropped.
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { toolNameContract, type ToolName } from '../../contracts/tool-name/tool-name-contract';

const TASK_TOOL_USE_NAME = toolNameContract.parse('Task');
const AGENT_TOOL_USE_NAME = toolNameContract.parse('Agent');

export const filterParentSourceEntriesTransformer = ({
  entries,
  taskToolUseIds,
}: {
  entries: readonly ChatEntry[];
  taskToolUseIds: Set<ToolName>;
}): ChatEntry[] => {
  const surviving: ChatEntry[] = [];
  for (const entry of entries) {
    if (entry.source !== 'session') {
      surviving.push(entry);
      continue;
    }

    if (entry.role === 'assistant' && entry.type === 'tool_use') {
      const { toolName } = entry;
      if (toolName === TASK_TOOL_USE_NAME || toolName === AGENT_TOOL_USE_NAME) {
        if (entry.toolUseId !== undefined) {
          taskToolUseIds.add(toolNameContract.parse(String(entry.toolUseId)));
        }
        surviving.push(entry);
      }
      continue;
    }

    if (entry.role === 'assistant' && entry.type === 'tool_result') {
      if (taskToolUseIds.has(entry.toolName)) {
        surviving.push(entry);
      }
      continue;
    }

    // Any other session-source entry (text, thinking, system error, task_notification,
    // user message) is dispatcher chatter — drop it.
  }
  return surviving;
};
