/**
 * PURPOSE: Resolves the Claude Code session id of a TOP-LEVEL (non-sub-agent) caller by scanning
 * every `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl` for an assistant line whose
 * `tool_use.id` equals the toolUseId Claude Code surfaces on every MCP call via
 * `request.params._meta['claudecode/toolUseId']`. The session's own JSONL records every assistant
 * tool_use it emits, including the MCP call being handled, so a content-match by tool_use.id maps
 * the call back to its originating session deterministically. The matching file's basename IS the
 * session id.
 *
 * USAGE:
 * const sessionId = await claudeCodeSessionFindByToolUseIdBroker({ projectDir, toolUseId });
 * // Returns the SessionId, or undefined when no JSONL line matches within the retry budget.
 *
 * WHEN-TO-USE: From the MCP `create-quest` path. A slash-command intake agent (ChaosWhisperer at
 *   `/dumpster-create`, BugHunt at `/dumpster-hunt`) runs INLINE in the user's own session, so it
 *   has no `subagents/agent-*.jsonl` file and the sub-agent resolver finds nothing. This is the
 *   top-level counterpart, and it is exact: it identifies the calling session even when several
 *   Claude sessions are open in the same repo, which a newest-mtime heuristic cannot.
 * WHEN-NOT-TO-USE: For a Task-dispatched sub-agent — use
 *   `claudeCodeParentSessionFindByToolUseIdBroker`, which also returns the realAgentId.
 */

import {
  pathSegmentContract,
  sessionIdContract,
  type AbsoluteFilePath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirIfExistsAdapter } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter';
import { claudeCodeToolUseScanLineContract } from '../../../contracts/claude-code-tool-use-scan-line/claude-code-tool-use-scan-line-contract';
import type { ToolUseId } from '../../../contracts/tool-use-id/tool-use-id-contract';
import { claudeSessionScanStatics } from '../../../statics/claude-session-scan/claude-session-scan-statics';

const JSONL_SUFFIX = '.jsonl';
const TOOL_USE_TYPE_TOKEN = '"type":"tool_use"';

export const claudeCodeSessionFindByToolUseIdBroker = async ({
  projectDir,
  toolUseId,
  attemptsLeft = claudeSessionScanStatics.maxAttempts,
}: {
  projectDir: AbsoluteFilePath;
  toolUseId: ToolUseId;
  // Internal: decrements on each tail-recursive retry. Callers should leave this at its
  // default; the broker manages the count itself.
  attemptsLeft?: number;
}): Promise<SessionId | undefined> => {
  const homeDir = osUserHomedirAdapter();
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir,
    projectPath: projectDir,
  });

  const toolUseIdString = String(toolUseId);
  const toolUseIdToken = `"id":"${toolUseIdString}"`;

  const topLevel = await fsReaddirIfExistsAdapter({
    filepath: pathSegmentContract.parse(String(sessionsDir)),
  });
  if (topLevel === undefined) {
    return undefined;
  }

  const sessionFileNames = topLevel
    .map((entry) => String(entry))
    .filter((name) => name.endsWith(JSONL_SUFFIX));

  const matches = await Promise.all(
    sessionFileNames.map(async (name) => {
      const filepath = pathSegmentContract.parse(`${String(sessionsDir)}/${name}`);
      try {
        const contents = String(await fsReadFileAdapter({ filepath }));
        // Cheap substring filter first; only parse JSON for lines that could match.
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
          return name.slice(0, -JSONL_SUFFIX.length);
        }
        return undefined;
      } catch {
        return undefined;
      }
    }),
  );

  for (const match of matches) {
    if (match !== undefined && match.length > 0) {
      return sessionIdContract.parse(match);
    }
  }

  // Miss — back off and recurse if we have budget. Recursion (vs. a for-loop) keeps the
  // serial-await intentional without tripping `no-await-in-loop`.
  if (attemptsLeft <= 1) {
    return undefined;
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, claudeSessionScanStatics.retryDelayMs);
  });
  return claudeCodeSessionFindByToolUseIdBroker({
    projectDir,
    toolUseId,
    attemptsLeft: attemptsLeft - 1,
  });
};
