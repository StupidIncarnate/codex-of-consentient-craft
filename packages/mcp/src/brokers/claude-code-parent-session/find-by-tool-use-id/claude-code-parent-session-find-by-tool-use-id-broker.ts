/**
 * PURPOSE: Resolves the parent Claude Code session id of a Task-dispatched sub-agent without
 * knowing the parent session up-front, by scanning EVERY session under
 * `~/.claude/projects/<encoded-cwd>/` for a `<sessionId>/subagents/agent-*.meta.json` sidecar
 * whose `toolUseId` field matches the toolUseId Claude Code surfaces on every MCP call via
 * `request.params._meta['claudecode/toolUseId']`. The toolUseId is unique per Task() dispatch
 * project-wide, so the match is deterministic — no mtime races, no parent-session ambiguity,
 * and no need for a prior monitor-session announcement. Returns both the parent sessionId AND
 * the sub-agent's realAgentId.
 *
 * USAGE:
 * const result = await claudeCodeParentSessionFindByToolUseIdBroker({ projectDir, toolUseId });
 * // Returns { parentSessionId, realAgentId } or undefined when no sidecar in any session
 * // directory matches the toolUseId.
 *
 * WHEN-TO-USE: From the MCP `get-agent-prompt` interaction layer to identify the calling
 *   sub-agent and announce the monitor session at the same time, replacing the boot-time
 *   mtime announce.
 */

import {
  agentIdContract,
  pathSegmentContract,
  sessionIdContract,
  type AbsoluteFilePath,
  type AgentId,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirIfExistsAdapter } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter';
import { claudeCodeSubagentMetaContract } from '../../../contracts/claude-code-subagent-meta/claude-code-subagent-meta-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';

const JSONL_SUFFIX = '.jsonl';
const AGENT_PREFIX = 'agent-';
const META_SUFFIX = '.meta.json';

export const claudeCodeParentSessionFindByToolUseIdBroker = async ({
  projectDir,
  toolUseId,
}: {
  projectDir: AbsoluteFilePath;
  toolUseId: ToolUseId;
}): Promise<{ parentSessionId: SessionId; realAgentId: AgentId } | undefined> => {
  const homeDir = osUserHomedirAdapter();
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir,
    projectPath: projectDir,
  });

  // List the per-project sessions root. Claude Code writes `<sessionId>.jsonl` files at this
  // level, with a sibling `<sessionId>/subagents/` directory for any session that has
  // dispatched at least one Task() sub-agent. Missing root is non-fatal — it just means no
  // Claude Code activity in this cwd yet.
  const topLevel = await fsReaddirIfExistsAdapter({
    filepath: pathSegmentContract.parse(String(sessionsDir)),
  });
  if (topLevel === undefined) {
    return undefined;
  }

  const sessionIds = topLevel
    .map((entry) => String(entry))
    .filter((name) => name.endsWith(JSONL_SUFFIX))
    .map((name) => name.slice(0, -JSONL_SUFFIX.length));

  // For each session, read its `<sessionId>/subagents/` dir (if any) and scan every
  // `agent-*.meta.json` sidecar for one whose `toolUseId` field matches. Process all
  // sessions in parallel — the toolUseId is unique project-wide so at most one sidecar
  // across all sessions will match.
  const matches = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const subagentsDir = `${String(sessionsDir)}/${sessionId}/subagents`;
      const entries = await fsReaddirIfExistsAdapter({
        filepath: pathSegmentContract.parse(subagentsDir),
      });
      if (entries === undefined) {
        return undefined;
      }
      const candidates = entries
        .map((entry) => String(entry))
        .filter((name) => name.startsWith(AGENT_PREFIX) && name.endsWith(META_SUFFIX));

      const reads = await Promise.all(
        candidates.map(async (name) => {
          const filepath = pathSegmentContract.parse(`${subagentsDir}/${name}`);
          try {
            const contents = String(await fsReadFileAdapter({ filepath }));
            const parsed = claudeCodeSubagentMetaContract.safeParse(JSON.parse(contents));
            if (parsed.success && parsed.data.toolUseId === toolUseId) {
              const realAgentId = name.slice(AGENT_PREFIX.length, name.length - META_SUFFIX.length);
              if (realAgentId.length === 0) {
                return undefined;
              }
              return { sessionId, realAgentId };
            }
            return undefined;
          } catch {
            return undefined;
          }
        }),
      );

      for (const match of reads) {
        if (match !== undefined) {
          return match;
        }
      }
      return undefined;
    }),
  );

  for (const match of matches) {
    if (match !== undefined) {
      return {
        parentSessionId: sessionIdContract.parse(match.sessionId),
        realAgentId: agentIdContract.parse(match.realAgentId),
      };
    }
  }
  return undefined;
};
