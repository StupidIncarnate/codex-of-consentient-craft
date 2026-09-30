/**
 * PURPOSE: Resolves the absolute path to a sub-agent JSONL file under the Claude sessions dir, scoped to a parent sessionId
 *
 * USAGE:
 * locationsClaudeSubagentSessionFilePathFindBroker({
 *   guildPath: '/home/user/my-project',
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   agentId: AgentIdStub({ value: 'xyz' }),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project/abc-123/subagents/agent-xyz.jsonl'
 */

import { locationsClaudeSessionsDirFindBroker } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { Agent } from '../../../contracts/agent/agent-contract';
import type { Session } from '../../../contracts/session/session-contract';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsClaudeSubagentSessionFilePathFindBroker = ({
  guildPath,
  sessionId,
  agentId,
}: {
  guildPath: Guild['path'];
  sessionId: Session['id'];
  agentId: Agent['id'];
}): string => {
  const sessionsDir = locationsClaudeSessionsDirFindBroker({ guildPath });

  const joined = join(
    sessionsDir,
    sessionId,
    locationsStatics.userHome.claude.subagentsDir,
    `agent-${agentId}.jsonl`,
  );

  return joined;
};
