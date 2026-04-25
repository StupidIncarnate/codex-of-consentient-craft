/**
 * PURPOSE: Resolves the absolute path to a sub-agent JSONL file under the Claude sessions dir, scoped to a parent sessionId
 *
 * USAGE:
 * locationsClaudeSubagentSessionFilePathFindBroker({
 *   guildPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
 *   sessionId: SessionIdStub({ value: 'abc-123' }),
 *   agentId: AgentIdStub({ value: 'xyz' }),
 * });
 * // Returns AbsoluteFilePath '/home/user/.claude/projects/-home-user-my-project/abc-123/subagents/agent-xyz.jsonl'
 */

import { locationsClaudeSessionsDirFindBroker } from '../claude-sessions-dir-find/locations-claude-sessions-dir-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SessionId } from '../../../contracts/session-id/session-id-contract';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';

export const locationsClaudeSubagentSessionFilePathFindBroker = ({
  guildPath,
  sessionId,
  agentId,
}: {
  guildPath: AbsoluteFilePath;
  sessionId: SessionId;
  agentId: AgentId;
}): AbsoluteFilePath => {
  const sessionsDir = locationsClaudeSessionsDirFindBroker({ guildPath });

  const joined = pathJoinAdapter({
    paths: [
      sessionsDir,
      sessionId,
      locationsStatics.userHome.claude.subagentsDir,
      `agent-${agentId}.jsonl`,
    ],
  });

  return absoluteFilePathContract.parse(joined);
};
