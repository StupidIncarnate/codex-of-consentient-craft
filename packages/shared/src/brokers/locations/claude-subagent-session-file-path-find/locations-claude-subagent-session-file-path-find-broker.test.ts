import { locationsClaudeSubagentSessionFilePathFindBroker } from './locations-claude-subagent-session-file-path-find-broker';
import { locationsClaudeSubagentSessionFilePathFindBrokerProxy } from './locations-claude-subagent-session-file-path-find-broker.proxy';
import { SessionIdStub } from '../../../contracts/session-id/session-id.stub';
import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { GuildStub } from '../../../contracts/guild/guild.stub';

describe('locationsClaudeSubagentSessionFilePathFindBroker', () => {
  describe('subagent session file path resolution', () => {
    it('VALID: {guildPath, sessionId, agentId} => returns sessions-dir/<sessionId>/subagents/agent-<agentId>.jsonl', () => {
      const proxy = locationsClaudeSubagentSessionFilePathFindBrokerProxy();

      proxy.setupSubagentSessionFilePath({ userHome: '/home/user' });

      const result = locationsClaudeSubagentSessionFilePathFindBroker({
        guildPath: GuildStub({ path: '/home/user/my-project' }).path,
        sessionId: SessionIdStub({ value: 'abc-123' }),
        agentId: AgentIdStub({ value: 'xyz' }),
      });

      expect(result).toBe(
        '/home/user/.claude/projects/-home-user-my-project/abc-123/subagents/agent-xyz.jsonl',
      );
    });
  });
});
