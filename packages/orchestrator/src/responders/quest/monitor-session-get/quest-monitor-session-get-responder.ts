/**
 * PURPOSE: Returns the currently-registered /dumpster-launch monitor session — the dispatcher's
 * parent sessionId plus projectDir — so the MCP layer can deterministically identify the
 * caller of `get-agent-prompt` per call (paired with `_meta.claudecode/toolUseId`) instead of
 * relying on the brittle mtime-based parent-session resolver.
 *
 * USAGE:
 * const session = QuestMonitorSessionGetResponder();
 * // Returns: { sessionId, projectDir } | null
 * // null when no /dumpster-launch session has registered yet (HTTP server reactor populates
 * // `monitorSessionState` asynchronously after observing active-monitor-session.json on disk).
 */

import {
  absoluteFilePathContract,
  sessionIdContract,
  type FilePath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

import { monitorSessionState } from '../../../state/monitor-session/monitor-session-state';

export const QuestMonitorSessionGetResponder = (): {
  sessionId: SessionId;
  projectDir: FilePath;
} | null => {
  const active = monitorSessionState.get();
  if (active === null) {
    return null;
  }

  // sessionFilePath shape: `<encoded-cwd>/<sessionId>.jsonl`. Strip `.jsonl` then take the
  // path segment after the last `/` to isolate the sessionId.
  const sessionFilePathAbsolute = absoluteFilePathContract.parse(String(active.sessionFilePath));
  const noSuffix = stripJsonlSuffixTransformer({ filePath: sessionFilePathAbsolute });
  const noSuffixStr = String(noSuffix);
  const lastSlash = noSuffixStr.lastIndexOf('/');
  const sessionIdStr = noSuffixStr.slice(lastSlash + 1);

  return {
    sessionId: sessionIdContract.parse(sessionIdStr),
    projectDir: active.projectDir,
  };
};
