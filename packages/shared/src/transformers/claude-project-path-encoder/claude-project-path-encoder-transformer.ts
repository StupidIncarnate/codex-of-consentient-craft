/**
 * PURPOSE: Builds the absolute path to a Claude CLI session JSONL file, mirroring the real Claude
 * CLI's own project-directory naming so lookups land where the CLI actually wrote the transcript.
 * The CLI turns every character that is not an ASCII letter or digit into a literal `-`,
 * one-for-one — confirmed by reading its bundled source (`e.replace(/[^a-zA-Z0-9]/g,"-")`) and by
 * cross-checking real `~/.claude/projects/*` directory names against the `cwd` recorded inside their
 * own session JSONL (e.g. a cwd ending `.claude/worktrees/x` produced a directory ending
 * `--claude-worktrees-x`: adjacent `/` and `.` each become their own hyphen, so runs of separators
 * do not collapse). The CLI additionally caps the encoded name at 200 characters with a
 * hash-suffixed truncation beyond that; this transformer does not reproduce that cap.
 *
 * USAGE:
 * claudeProjectPathEncoderTransformer({
 *   homeDir: AbsoluteFilePathStub({ value: '/home/user' }),
 *   projectPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl'
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SessionId } from '../../contracts/session-id/session-id-contract';

export const claudeProjectPathEncoderTransformer = ({
  homeDir,
  projectPath,
  sessionId,
}: {
  homeDir: AbsoluteFilePath;
  projectPath: AbsoluteFilePath;
  sessionId: SessionId;
}): AbsoluteFilePath => {
  const encoded = projectPath.replace(/[^a-zA-Z0-9]/gu, '-');
  return absoluteFilePathContract.parse(
    `${homeDir}/.claude/projects/${encoded}/${sessionId}.jsonl`,
  );
};
