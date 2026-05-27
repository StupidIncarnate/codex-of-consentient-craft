/**
 * PURPOSE: Layer of InteractionHandleResponder — resolves the calling sub-agent's
 * {sessionId, agentId} from MCP request metadata so `get-agent-prompt` can stamp work-item
 * identity. Primary path uses `_meta.claudecode/toolUseId` paired with the registered
 * monitor session (deterministic, race-free). Falls back to the legacy mtime + first-line
 * workItemId scan for older Claude Code clients that don't populate `_meta`.
 *
 * USAGE:
 * const identity = await ResolveSubagentIdentityLayerResponder({ meta, workItemId });
 * // Returns { sessionId, agentId } | undefined
 */

import {
  absoluteFilePathContract,
  type AgentId,
  type QuestWorkItemId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { claudeCodeSessionResolveBroker } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker';
import { claudeCodeSubagentFindByToolUseIdBroker } from '../../../brokers/claude-code-subagent/find-by-tool-use-id/claude-code-subagent-find-by-tool-use-id-broker';
import { claudeCodeSubagentFindByWorkItemIdBroker } from '../../../brokers/claude-code-subagent/find-by-work-item-id/claude-code-subagent-find-by-work-item-id-broker';
import { orchestratorGetMonitorSessionAdapter } from '../../../adapters/orchestrator/get-monitor-session/orchestrator-get-monitor-session-adapter';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';

const TOOL_USE_ID_META_KEY = 'claudecode/toolUseId';

export const ResolveSubagentIdentityLayerResponder = async ({
  meta,
  workItemId,
}: {
  meta?: Record<string, unknown>;
  workItemId: QuestWorkItemId;
}): Promise<{ sessionId: SessionId; agentId: AgentId } | undefined> => {
  // Primary path: Claude Code surfaces `claudecode/toolUseId` on every MCP call. Paired
  // with the dispatcher's registered monitor session, this yields the calling sub-agent
  // deterministically — no mtime race, no parent-session ambiguity. Each Task() dispatch
  // writes its own `agent-<realAgentId>.meta.json` sidecar with the toolUseId.
  const toolUseIdRaw = meta?.[TOOL_USE_ID_META_KEY];
  if (typeof toolUseIdRaw === 'string') {
    const parsedToolUseId = toolUseIdContract.safeParse(toolUseIdRaw);
    const monitorSession = orchestratorGetMonitorSessionAdapter();
    if (parsedToolUseId.success && monitorSession !== null) {
      const projectDirForToolUse = absoluteFilePathContract.parse(
        String(monitorSession.projectDir),
      );
      const realAgentId = await claudeCodeSubagentFindByToolUseIdBroker({
        projectDir: projectDirForToolUse,
        parentSessionId: monitorSession.sessionId,
        toolUseId: parsedToolUseId.data,
      });
      if (realAgentId !== undefined) {
        return { sessionId: monitorSession.sessionId, agentId: realAgentId };
      }
    }
  }

  // Fallback: legacy mtime-based parent-session resolution + first-line workItemId scan.
  // Covers older Claude Code clients that don't populate `_meta.claudecode/toolUseId`, and
  // direct integration-test invocations that bypass the dispatcher. Subject to the mtime
  // race documented on `claudeCodeSessionResolveBroker` — only reliable for serial dispatch.
  const cwd = processCwdAdapter();
  const projectDir = absoluteFilePathContract.parse(String(cwd));
  const parent = await claudeCodeSessionResolveBroker({ projectDir });
  if (parent === undefined) {
    return undefined;
  }
  const realAgentId = await claudeCodeSubagentFindByWorkItemIdBroker({
    projectDir,
    parentSessionId: parent.sessionId,
    workItemId,
  });
  if (realAgentId === undefined) {
    return undefined;
  }
  return { sessionId: parent.sessionId, agentId: realAgentId };
};
