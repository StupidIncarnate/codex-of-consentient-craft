/**
 * PURPOSE: Resolves the CALLER's actual working directory for an MCP call by scanning Claude
 * Code's own session JSONL for the line whose `tool_use.id` equals `_meta['claudecode/toolUseId']`
 * and reading that line's top-level `cwd`. The MCP stdio child is one per top-level Claude Code
 * session (shared by every Task-dispatched sub-agent) and its own `process.cwd()` never moves, so
 * this JSONL scan is the ONLY channel that carries a sub-agent's real, possibly worktree-pinned,
 * location — confirmed empirically: three live dungeonmaster MCP server processes all report
 * `cwd`/`CLAUDE_PROJECT_DIR` pinned to their top-level launch directory regardless of which
 * worktree a calling sub-agent's own tools were pinned to. Scans both shapes Claude Code writes
 * under `~/.claude/projects/<encoded-projectDir>/`: a top-level `<sessionId>.jsonl` (inline
 * session, no sub-agent dispatch) and `<sessionId>/subagents/agent-*.jsonl` (Task-dispatched
 * sub-agent). If a future Claude CLI version stops stamping `cwd` on assistant lines, every match
 * here degrades to `undefined` — callerRepoRootResolveBroker is what makes that fallback LOUD to
 * the tool caller, not this broker, which only reports what it found. This is the COLD path — a
 * fresh, uncached scan; callerCwdScanCachedEntriesFindByToolUseIdBroker checks the warm cursor
 * cache first and only falls back here on a miss.
 *
 * PERFORMANCE: `stat`s every candidate file (metadata only — cheap even at hundreds of files),
 * visits them newest-mtime-first via scanFilepathsFromTailLayerBroker, which itself scans each
 * file's lines from the tail backwards and stops at the first match. A naive "read every file,
 * scan every line forward" pass measured 3.66s on a real 1.6GB/283-file project directory; this
 * ordering is what turns the common case into "one file, a handful of lines" without changing the
 * worst case. toolUseIds are unique across Claude Code's lifetime (the same assumption
 * claudeCodeParentSessionFindByToolUseIdBroker already makes), so stopping at the first file hit
 * can never return a STALE cwd from the wrong file — there is only ever one file that can match.
 *
 * USAGE:
 * const hit = await claudeCodeCallerCwdFindByToolUseIdBroker({ projectDir, toolUseId });
 * // hit is { cwd, cursor: { filepath, offsetBytes } } for the matching file, so the caller can
 * // seed callerCwdScanCursorState and make the NEXT lookup in this file a warm one, or undefined
 * // when no JSONL line matches within the retry budget.
 */

import { pathSegmentContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReaddirIfExistsAdapter } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import type { CallerCwdScanCursor } from '../../../contracts/caller-cwd-scan-cursor/caller-cwd-scan-cursor-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { claudeSessionScanStatics } from '../../../statics/claude-session-scan/claude-session-scan-statics';
import { scanFilepathsFromTailLayerBroker } from './scan-filepaths-from-tail-layer-broker';

const JSONL_SUFFIX = '.jsonl';
const AGENT_PREFIX = 'agent-';

export const claudeCodeCallerCwdFindByToolUseIdBroker = async ({
  projectDir,
  toolUseId,
  attemptsLeft = claudeSessionScanStatics.maxAttempts,
}: {
  projectDir: AbsoluteFilePath;
  toolUseId: ToolUseId;
  // Internal: decrements on each tail-recursive retry. Callers should leave this at its
  // default; the broker manages the count itself.
  attemptsLeft?: number;
}): Promise<{ cwd: AbsoluteFilePath; cursor: CallerCwdScanCursor } | undefined> => {
  const homeDir = osUserHomedirAdapter();
  const sessionsDir = String(
    claudePathSlugEncoderTransformer({ homeDir, projectPath: projectDir }),
  );
  const toolUseIdString = String(toolUseId);
  const toolUseIdToken = `"id":"${toolUseIdString}"`;

  const topLevel = await fsReaddirIfExistsAdapter({
    filepath: pathSegmentContract.parse(sessionsDir),
  });
  if (topLevel === undefined) {
    return undefined;
  }

  const sessionIds = topLevel
    .map((entry) => String(entry))
    .filter((name) => name.endsWith(JSONL_SUFFIX))
    .map((name) => name.slice(0, -JSONL_SUFFIX.length));

  const topLevelStats = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const filepath = `${sessionsDir}/${sessionId}${JSONL_SUFFIX}`;
      const stat = await fsStatAdapter({ filepath: pathSegmentContract.parse(filepath) });
      return { sessionId, filepath, mtimeMs: stat.mtimeMs };
    }),
  );
  const topLevelFilepathsByMtime = [...topLevelStats]
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((entry) => entry.filepath);

  const topLevelHit = await scanFilepathsFromTailLayerBroker({
    filepaths: topLevelFilepathsByMtime,
    toolUseIdString,
    toolUseIdToken,
  });
  if (topLevelHit !== undefined) {
    return topLevelHit;
  }

  // Miss across every top-level file — expand to every session's subagents/agent-*.jsonl,
  // again visited newest-mtime-first.
  const subagentsDirListings = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const subagentsDir = `${sessionsDir}/${sessionId}/subagents`;
      const entries = await fsReaddirIfExistsAdapter({
        filepath: pathSegmentContract.parse(subagentsDir),
      });
      return { subagentsDir, entries: entries ?? [] };
    }),
  );
  const agentFilepaths = subagentsDirListings.flatMap(({ subagentsDir, entries }) =>
    entries
      .map((entry) => String(entry))
      .filter((name) => name.startsWith(AGENT_PREFIX) && name.endsWith(JSONL_SUFFIX))
      .map((name) => `${subagentsDir}/${name}`),
  );
  const agentStats = await Promise.all(
    agentFilepaths.map(async (filepath) => {
      const stat = await fsStatAdapter({ filepath: pathSegmentContract.parse(filepath) });
      return { filepath, mtimeMs: stat.mtimeMs };
    }),
  );
  const agentFilepathsByMtime = [...agentStats]
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map((entry) => entry.filepath);

  const agentHit = await scanFilepathsFromTailLayerBroker({
    filepaths: agentFilepathsByMtime,
    toolUseIdString,
    toolUseIdToken,
  });
  if (agentHit !== undefined) {
    return agentHit;
  }

  // Miss — back off and recurse if we have budget. Recursion (vs. a for-loop) keeps the
  // serial-await intentional without tripping `no-await-in-loop`.
  if (attemptsLeft <= 1) {
    return undefined;
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, claudeSessionScanStatics.retryDelayMs);
  });
  return claudeCodeCallerCwdFindByToolUseIdBroker({
    projectDir,
    toolUseId,
    attemptsLeft: attemptsLeft - 1,
  });
};
