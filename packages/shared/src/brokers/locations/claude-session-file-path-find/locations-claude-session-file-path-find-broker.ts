/**
 * PURPOSE: Resolves the absolute path to a single Claude session JSONL file for a guild + sessionId
 *
 * USAGE:
 * locationsClaudeSessionFilePathFindBroker({
 *   guildPath: '/home/user/my-project',
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl'
 */

import { locationsClaudeSessionsDirFindBroker } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker';
import { join } from '#gateway/node/path';
import type { Session } from '../../../contracts/session/session-contract';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsClaudeSessionFilePathFindBroker = ({
  guildPath,
  sessionId,
}: {
  guildPath: Guild['path'];
  sessionId: Session['id'];
}): string => {
  const sessionsDir = locationsClaudeSessionsDirFindBroker({ guildPath });

  const joined = join(sessionsDir, `${sessionId}.jsonl`);

  return joined;
};
