/**
 * PURPOSE: Resolves a parent Claude Code session id by listing
 * `~/.claude/projects/<encoded-cwd>/*.jsonl` and returning the basename of the
 * most-recently-modified file. **Fallback path only.** Reliable at MCP boot (when the
 * dispatcher session is the only one actively writing in this cwd) but races against any
 * other Claude session in the same project cwd once /dumpster-launch is idle waiting on
 * Task() results — that competing session's writes can win the mtime contest and this
 * broker then returns the WRONG sessionId.
 *
 * Primary deterministic source for per-call sub-agent identification:
 * `claudeCodeSubagentFindByToolUseIdBroker`, which keys off
 * `request.params._meta.claudecode/toolUseId` and the registered monitor-session — no
 * mtime races. Callers that have access to a per-call toolUseId should prefer that.
 *
 * Surviving consumers of this resolver (boot-time + foreground-only paths where the mtime
 * race doesn't apply): MonitorSessionAnnounceResponder, QuestHandleResponder's create-quest
 * path, and the InteractionHandleResponder fallback for older Claude Code clients lacking
 * `_meta` plumbing.
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
