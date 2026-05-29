/**
 * PURPOSE: Resolves the parent Claude Code session id of a Task-dispatched sub-agent by
 * scanning every `<encoded-cwd>/<sessionId>/subagents/agent-*.jsonl` file under
 * `~/.claude/projects/` for an assistant line whose `tool_use.id` equals the toolUseId
 * Claude Code surfaces on every MCP call via `request.params._meta['claudecode/toolUseId']`.
 * That field carries the toolUseId of the SUB-AGENT'S OWN MCP call (NOT the parent's
 * Task() dispatch id, which is what the sibling `agent-<realAgentId>.meta.json` sidecar
 * carries — those two ids are distinct). The sub-agent's JSONL records every assistant
 * tool_use it emits, including the MCP call we're handling, so a content-match by
 * tool_use.id maps the call back to its originating sub-agent file deterministically.
 * The filename yields realAgentId; the parent of `subagents/` is parentSessionId.
 *
 * The broker recurses with a small fixed-delay backoff so the deterministic match isn't
 * lost to the Claude-Code-dispatches-MCP-call-BEFORE-flushing-JSONL flush race
 * (empirically ~50–200ms gap). Total budget ~1s, well under the MCP request timeout.
 *
 * USAGE:
 * const result = await claudeCodeParentSessionFindByToolUseIdBroker({ projectDir, toolUseId });
 * // Returns { parentSessionId, realAgentId } or undefined when no JSONL line matches
 * // within the retry budget.
 *
 * WHEN-TO-USE: From the MCP `get-agent-prompt` interaction layer to identify the calling
 *   sub-agent so the responder can stamp `workItem.sessionId` and `workItem.agentId`,
 *   which then drives the HTTP server's quest-driven watcher reactor.
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
import { claudeCodeToolUseScanLineContract } from '../../../contracts/claude-code-tool-use-scan-line/claude-code-tool-use-scan-line-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';

const JSONL_SUFFIX = '.jsonl';
const AGENT_PREFIX = 'agent-';
const TOOL_USE_TYPE_TOKEN = '"type":"tool_use"';
// 30 × 100ms = 3 s total budget. Sized to absorb worst-case flush latency under load
// (parallel sub-agent dispatch, slow disk, large assistant messages with thinking
// content embedded around the tool_use line) while staying well under any MCP request
// timeout. Common case still returns on the first hit — the budget is the ceiling, not
// the cost.
const MAX_SCAN_ATTEMPTS = 30;
const SCAN_RETRY_DELAY_MS = 100;

export const claudeCodeParentSessionFindByToolUseIdBroker = async ({
  projectDir,
  toolUseId,
  attemptsLeft = MAX_SCAN_ATTEMPTS,
}: {
  projectDir: AbsoluteFilePath;
  toolUseId: ToolUseId;
  // Internal: decrements on each tail-recursive retry. Callers should leave this at its
  // default; the broker manages the count itself.
  attemptsLeft?: number;
}): Promise<{ parentSessionId: SessionId; realAgentId: AgentId } | undefined> => {
  const homeDir = osUserHomedirAdapter();
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir,
    projectPath: projectDir,
  });

  const toolUseIdString = String(toolUseId);
  const toolUseIdToken = `"id":"${toolUseIdString}"`;

  // List the per-project sessions root. Claude Code writes `<sessionId>.jsonl` files at
  // this level, with a sibling `<sessionId>/subagents/` directory for any session that
  // has dispatched at least one Task() sub-agent. Missing root is non-fatal — it just
  // means no Claude Code activity in this cwd yet.
  const topLevel = await fsReaddirIfExistsAdapter({
    filepath: pathSegmentContract.parse(String(sessionsDir)),
  });
  if (topLevel === undefined) {
    return undefined;
  }

  // Each entry under sessionsDir is either `<sessionId>.jsonl` (file) or `<sessionId>`
  // (directory) — for our scan we want the directory names, which match the JSONL
  // basenames minus the suffix. Use the file list as the canonical session id source.
  const sessionIds = topLevel
    .map((entry) => String(entry))
    .filter((name) => name.endsWith(JSONL_SUFFIX))
    .map((name) => name.slice(0, -JSONL_SUFFIX.length));

  // For each session, read its `<sessionId>/subagents/` dir and scan every
  // `agent-*.jsonl` file for a line containing BOTH the tool_use type token AND the
  // toolUseId token. Cheap substring filter first; only parse JSON for lines that pass.
  // The first line whose `tool_use.id` matches IS the call we're handling (toolUseIds
  // are unique across Claude Code's lifetime).
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
        .filter((name) => name.startsWith(AGENT_PREFIX) && name.endsWith(JSONL_SUFFIX));

      const reads = await Promise.all(
        candidates.map(async (name) => {
          const filepath = pathSegmentContract.parse(`${subagentsDir}/${name}`);
          try {
            const contents = String(await fsReadFileAdapter({ filepath }));
            // Skip JSONLs that don't even mention this toolUseId.
            if (!contents.includes(toolUseIdToken)) {
              return undefined;
            }
            for (const line of contents.split('\n')) {
              if (line.length === 0) continue;
              if (!line.includes(TOOL_USE_TYPE_TOKEN)) continue;
              if (!line.includes(toolUseIdToken)) continue;
              const parsed = claudeCodeToolUseScanLineContract.safeParse(JSON.parse(line));
              if (!parsed.success) continue;
              const content = parsed.data.message?.content ?? [];
              const hit = content.some(
                (item) => String(item.type) === 'tool_use' && String(item.id) === toolUseIdString,
              );
              if (!hit) continue;
              const realAgentId = name.slice(
                AGENT_PREFIX.length,
                name.length - JSONL_SUFFIX.length,
              );
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

  // Miss — back off and recurse if we have budget. Recursion (vs. a for-loop) keeps the
  // serial-await intentional without tripping `no-await-in-loop`.
  if (attemptsLeft <= 1) {
    return undefined;
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, SCAN_RETRY_DELAY_MS);
  });
  return claudeCodeParentSessionFindByToolUseIdBroker({
    projectDir,
    toolUseId,
    attemptsLeft: attemptsLeft - 1,
  });
};
