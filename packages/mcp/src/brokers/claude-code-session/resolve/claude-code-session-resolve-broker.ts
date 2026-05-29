/**
 * PURPOSE: Resolves a parent Claude Code session id by listing
 * `~/.claude/projects/<encoded-cwd>/*.jsonl` and returning the basename of the
 * most-recently-modified file. **Legacy fallback — only safe when the caller is the user's
 * own foreground Claude session at the exact moment they invoke an MCP tool.** Races
 * against any other Claude session in the same project cwd whose JSONL was written more
 * recently.
 *
 * Primary deterministic alternative for per-call sub-agent identification:
 * `claudeCodeParentSessionFindByToolUseIdBroker`, which keys off
 * `request.params._meta.claudecode/toolUseId` and a cross-session scan of
 * `subagents/agent-*.jsonl` for a matching `tool_use.id` — no mtime, no races, no prior
 * monitor-session registration needed.
 *
 * Sole surviving consumer of this resolver is QuestHandleResponder's create-quest path:
 * ChaosWhisperer in /dumpster-create has no parent Task() toolUseId because it runs
 * inline in the user's session, so we read mtime in that narrow window where the user
 * just typed the slash command and their JSONL is necessarily the newest.
 *
 * USAGE:
 * const result = await claudeCodeSessionResolveBroker({ projectDir });
 * // Returns { sessionId, sessionFilePath } or undefined when the encoded dir is missing or empty.
 */

import {
  absoluteFilePathContract,
  pathSegmentContract,
  sessionIdContract,
  type AbsoluteFilePath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';

import { fsReaddirIfExistsAdapter } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { folderNameContract } from '../../../contracts/folder-name/folder-name-contract';

const JSONL_SUFFIX = '.jsonl';

export const claudeCodeSessionResolveBroker = async ({
  projectDir,
}: {
  projectDir: AbsoluteFilePath;
}): Promise<{ sessionId: SessionId; sessionFilePath: AbsoluteFilePath } | undefined> => {
  const homeDir = osUserHomedirAdapter();
  const sessionsDir = claudePathSlugEncoderTransformer({
    homeDir,
    projectPath: projectDir,
  });

  const entries = await fsReaddirIfExistsAdapter({
    filepath: pathSegmentContract.parse(String(sessionsDir)),
  });

  if (entries === undefined) {
    return undefined;
  }

  const jsonlNames = entries.filter((name) => String(name).endsWith(JSONL_SUFFIX));
  if (jsonlNames.length === 0) {
    return undefined;
  }

  const statsResults = await Promise.all(
    jsonlNames.map(async (name) => {
      const filepath = pathSegmentContract.parse(`${String(sessionsDir)}/${String(name)}`);
      const stat = await fsStatAdapter({ filepath });
      return {
        name: folderNameContract.parse(name),
        mtimeMs: stat.mtimeMs,
      };
    }),
  );

  const sortedByMtime = [...statsResults].sort((a, b) => b.mtimeMs - a.mtimeMs);
  const [newest] = sortedByMtime;
  if (newest === undefined) {
    return undefined;
  }

  const nameStr = String(newest.name);
  return {
    sessionId: sessionIdContract.parse(nameStr.slice(0, -JSONL_SUFFIX.length)),
    sessionFilePath: absoluteFilePathContract.parse(`${String(sessionsDir)}/${nameStr}`),
  };
};
