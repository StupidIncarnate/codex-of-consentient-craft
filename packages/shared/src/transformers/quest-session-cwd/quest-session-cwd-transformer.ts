/**
 * PURPOSE: Reads back the cwd a named session actually ran in, from the quest's own append-only
 * `sessions` ledger. Reach for this whenever the question is "where did this session ALREADY run" —
 * locating a transcript, starting a tail over one. The per-quest resolution answers a different
 * question, "where does the NEXT thing run", and a carved quest's two answers disagree: the intake
 * conversation ran at the repo root and every role after the carve ran in the worktree.
 *
 * USAGE:
 * questSessionCwdTransformer({ quest, sessionId });
 * // Returns the recorded AbsoluteFilePath, or null when this quest holds no row for that session
 *
 * Both read paths share this one lookup deliberately. Live streaming and replay disagreeing about
 * where a session lives IS the defect the ledger exists to close, and two copies of a `.find` in two
 * packages is how they drifted apart in the first place.
 */

import type { Quest } from '../../contracts/quest/quest-contract';
import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SessionId } from '../../contracts/session-id/session-id-contract';

export const questSessionCwdTransformer = ({
  quest,
  sessionId,
}: {
  quest: Quest;
  sessionId: SessionId;
}): AbsoluteFilePath | null => {
  const row = quest.sessions.find((session) => session.sessionId === sessionId);

  return row === undefined ? null : row.cwd;
};
