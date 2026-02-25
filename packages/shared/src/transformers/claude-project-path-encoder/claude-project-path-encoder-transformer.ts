/**
 * PURPOSE: Builds the absolute path to a Claude CLI session JSONL file by encoding the project path
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
  const encoded = projectPath.replace(/\//gu, '-');
  return absoluteFilePathContract.parse(
    `${homeDir}/.claude/projects/${encoded}/${sessionId}.jsonl`,
  );
};
