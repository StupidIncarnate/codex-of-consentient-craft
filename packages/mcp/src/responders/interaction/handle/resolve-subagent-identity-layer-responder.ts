/**
 * PURPOSE: Layer of InteractionHandleResponder — resolves the calling sub-agent's
 * {sessionId, agentId} from MCP request metadata so `get-agent-prompt` can stamp work-item
 * identity. Uses `_meta.claudecode/toolUseId` (the toolUseId of the sub-agent's OWN MCP
 * call) paired with a cross-session JSONL scan (claudeCodeParentSessionFindByToolUseIdBroker)
 * that matches by `tool_use.id` in each `subagents/agent-*.jsonl`. Deterministic — no
 * mtime races, no announce file, no global monitor session. The stamped sessionId becomes
 * a new entry in the quest's `workItems[].sessionId`, which the HTTP server's quest-driven
 * watcher reactor picks up on the next quest-modified event and starts tailing.
 *
 * USAGE:
 * const identity = await ResolveSubagentIdentityLayerResponder({ meta });
 * // Returns { sessionId, agentId } | undefined
 */

import {
  absoluteFilePathContract,
  type AgentId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { claudeCodeParentSessionFindByToolUseIdBroker } from '../../../brokers/claude-code-parent-session/find-by-tool-use-id/claude-code-parent-session-find-by-tool-use-id-broker';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';

const TOOL_USE_ID_META_KEY = 'claudecode/toolUseId';

export const ResolveSubagentIdentityLayerResponder = async ({
  meta,
}: {
  meta?: Record<string, unknown>;
}): Promise<{ sessionId: SessionId; agentId: AgentId } | undefined> => {
  // Claude Code surfaces `claudecode/toolUseId` on every MCP call from a Task-dispatched
  // sub-agent. Without it we cannot identify the caller deterministically — no fallback.
  const toolUseIdRaw = meta?.[TOOL_USE_ID_META_KEY];
  if (typeof toolUseIdRaw !== 'string') {
    return undefined;
  }
  const parsedToolUseId = toolUseIdContract.safeParse(toolUseIdRaw);
  if (!parsedToolUseId.success) {
    return undefined;
  }

  const cwd = processCwdAdapter();
  const projectDir = absoluteFilePathContract.parse(String(cwd));

  const found = await claudeCodeParentSessionFindByToolUseIdBroker({
    projectDir,
    toolUseId: parsedToolUseId.data,
  });
  if (found === undefined) {
    return undefined;
  }

  return { sessionId: found.parentSessionId, agentId: found.realAgentId };
};
