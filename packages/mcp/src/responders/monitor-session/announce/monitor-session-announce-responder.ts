/**
 * PURPOSE: Responder for the MCP monitor-session announce. Resolves the parent Claude Code session id from process.env.CLAUDE_CODE_SESSION_ID first; falls back to scanning `~/.claude/projects/<encoded-cwd>/*.jsonl` for the most-recently-modified file when the env var is unset (Claude Code does not currently set CLAUDE_CODE_SESSION_ID on stdio MCP children). Writes the result to `<DUNGEONMASTER_HOME>/active-monitor-session.json` so the HTTP server reactor can start its JSONL tail.
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
