/**
 * PURPOSE: Resolves the absolute path to a single Claude session JSONL file for a guild + sessionId
 *
 * USAGE:
 * locationsClaudeSessionFilePathFindBroker({
 *   guildPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl'
 */

import { locationsClaudeSessionsDirFindBroker } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker';
import { join } from '#gateway/node/path';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { Session } from '../../../contracts/session/session-contract';

export const locationsClaudeSessionFilePathFindBroker = ({
  guildPath,
  sessionId,
}: {
  guildPath: AbsoluteFilePath;
  sessionId: Session['id'];
}): AbsoluteFilePath => {
  const sessionsDir = locationsClaudeSessionsDirFindBroker({ guildPath });

  const joined = join(sessionsDir, `${sessionId}.jsonl`);

  return absoluteFilePathContract.parse(joined);
};
