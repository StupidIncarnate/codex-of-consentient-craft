/**
 * PURPOSE: Layer of InteractionHandleResponder — resolves the calling sub-agent's
 * {sessionId, agentId} from MCP request metadata so `get-agent-prompt` can stamp work-item
 * identity. Reads the caller context the pre-MCP-caller hook stamped onto the call first; only when
 * no hook ran does it fall back to `_meta.claudecode/toolUseId` (the toolUseId of the sub-agent's OWN MCP
 * call) paired with a cross-session JSONL scan (claudeCodeParentSessionFindByToolUseIdBroker)
 * that matches by `tool_use.id` in each `subagents/agent-*.jsonl`. Deterministic — no
 * mtime races, no announce file, no global monitor session. The stamped sessionId becomes
 * a new entry in the quest's `workItems[].sessionId`, which the HTTP server's quest-driven
 * watcher reactor picks up on the next quest-modified event and starts tailing.
 *
 * USAGE:
 * const identity = await ResolveSubagentIdentityLayerResponder({ meta });
 * // Returns { sessionId, agentId, cwd } | undefined
 *
 * `cwd` is the MCP stdio child's own working directory, which IS the calling session's — Claude Code
 * spawns one MCP child per session. It rides along because Claude CLI encodes a transcript's
 * directory from the session's cwd, and for a `/dumpster-launch` dispatcher on a CARVED quest that
 * directory is the repo root while the quest's own `worktreePath` says otherwise. Recording the
 * quest's answer there would enshrine a wrong directory instead of merely guessing one.
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type AgentId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { claudeCodeParentSessionFindByToolUseIdBroker } from '../../../brokers/claude-code-parent-session/find-by-tool-use-id/claude-code-parent-session-find-by-tool-use-id-broker';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { metaCallerContextTransformer } from '../../../transformers/meta-caller-context/meta-caller-context-transformer';

const TOOL_USE_ID_META_KEY = 'claudecode/toolUseId';

export const ResolveSubagentIdentityLayerResponder = async ({
  meta,
}: {
  meta?: Record<string, unknown>;
}): Promise<{ sessionId: SessionId; agentId: AgentId; cwd: AbsoluteFilePath } | undefined> => {
  // The pre-MCP-caller hook already knows the answer: for a Task-dispatched sub-agent its
  // `session_id` is the PARENT session and its `agent_id` is the id in the sub-agent's own
  // `subagents/agent-<id>.jsonl` filename — the same pair the scan below recovers. A caller with no
  // agentId is a top-level session, which the scan could never match either.
  const caller = metaCallerContextTransformer({ meta });
  if (caller !== undefined) {
    return caller.agentId === undefined
      ? undefined
      : {
          sessionId: caller.sessionId,
          agentId: caller.agentId,
          cwd: absoluteFilePathContract.parse(String(processCwdAdapter())),
        };
  }

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

  // `projectDir` is the ONE directory the scan searched, so a hit proves the transcript is under it.
  return { sessionId: found.parentSessionId, agentId: found.realAgentId, cwd: projectDir };
};
