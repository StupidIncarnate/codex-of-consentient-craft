/**
 * PURPOSE: Responder for the MCP monitor-session announce. Resolves the parent Claude Code
 * session id, then writes the result to `<DUNGEONMASTER_HOME>/active-monitor-session.json`
 * so the HTTP server reactor can start its JSONL tail.
 *
 * Resolution strategy:
 *   1. `process.env.CLAUDE_CODE_SESSION_ID` if set. (Currently DORMANT — Claude Code does
 *      not populate this on stdio MCP children today. Kept for forward-compatibility in case
 *      that changes; integration tests still exercise it by setting the env var explicitly.)
 *   2. Otherwise, mtime scan via `claudeCodeSessionResolveBroker` — picks the most-recently-
 *      modified `*.jsonl` in `~/.claude/projects/<encoded-cwd>/`. Reliable at MCP boot because
 *      the dispatcher session is the only Claude session writing to its own JSONL at that
 *      moment, but degrades under cross-session activity later (see that broker's PURPOSE).
 *
 * This responder fires once per MCP process (at first tool call, see mcp-server-flow.ts).
 * Per-call sub-agent identification — a separate concern — uses
 * `request.params._meta.claudecode/toolUseId` via
 * `claudeCodeSubagentFindByToolUseIdBroker`, which is race-free regardless of env shape.
 *
 * USAGE:
 * await MonitorSessionAnnounceResponder();
 * // Returns: AdapterResult — { success: true } whether written or skipped.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { monitorSessionAnnounceBroker } from '../../../brokers/monitor-session/announce/monitor-session-announce-broker';
import { claudeCodeSessionResolveBroker } from '../../../brokers/claude-code-session/resolve/claude-code-session-resolve-broker';

export const MonitorSessionAnnounceResponder = async (): Promise<AdapterResult> => {
  const { homePath } = dungeonmasterHomeFindBroker();
  const cwd = processCwdAdapter();
  const projectDir = absoluteFilePathContract.parse(String(cwd));

  const envSessionId = process.env.CLAUDE_CODE_SESSION_ID;
  const hasEnvSessionId = envSessionId !== undefined && envSessionId !== '';
  const fallback = hasEnvSessionId
    ? undefined
    : await claudeCodeSessionResolveBroker({ projectDir });
  const parentSessionId = hasEnvSessionId ? envSessionId : fallback?.sessionId;

  return monitorSessionAnnounceBroker({
    parentSessionId,
    projectDir: String(projectDir),
    nowIso: new Date().toISOString(),
    homeDir: String(homePath),
  });
};
