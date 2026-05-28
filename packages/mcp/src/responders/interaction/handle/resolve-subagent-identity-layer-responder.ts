/**
 * PURPOSE: Layer of InteractionHandleResponder — resolves the calling sub-agent's
 * {sessionId, agentId} from MCP request metadata so `get-agent-prompt` can stamp work-item
 * identity. Uses `_meta.claudecode/toolUseId` paired with a cross-session sidecar scan
 * (claudeCodeParentSessionFindByToolUseIdBroker) to deterministically locate the parent
 * session — no mtime races, no boot-time announce. The FIRST successful resolution in
 * this MCP process also writes `<DUNGEONMASTER_HOME>/active-monitor-session.json` via
 * monitorSessionAnnounceBroker so the HTTP server reactor starts tailing the parent's
 * JSONL. Subsequent calls reuse the latched parentSessionId without re-announcing.
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
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';

import { claudeCodeParentSessionFindByToolUseIdBroker } from '../../../brokers/claude-code-parent-session/find-by-tool-use-id/claude-code-parent-session-find-by-tool-use-id-broker';
import { monitorSessionAnnounceBroker } from '../../../brokers/monitor-session/announce/monitor-session-announce-broker';
import { announcedParentSessionState } from '../../../state/announced-parent-session/announced-parent-session-state';
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

  // First-time resolution in this MCP process: announce the parent session so the HTTP
  // server reactor starts the JSONL watcher. The toolUseId match was deterministic, so
  // the parentSessionId we're announcing IS the legitimate /dumpster-launch (or
  // /dumpster-create) session — no mtime race.
  if (announcedParentSessionState.get() !== found.parentSessionId) {
    announcedParentSessionState.set({ parentSessionId: found.parentSessionId });
    const { homePath } = dungeonmasterHomeFindBroker();
    await monitorSessionAnnounceBroker({
      parentSessionId: String(found.parentSessionId),
      projectDir: String(projectDir),
      nowIso: new Date().toISOString(),
      homeDir: String(homePath),
    });
  }

  return { sessionId: found.parentSessionId, agentId: found.realAgentId };
};
