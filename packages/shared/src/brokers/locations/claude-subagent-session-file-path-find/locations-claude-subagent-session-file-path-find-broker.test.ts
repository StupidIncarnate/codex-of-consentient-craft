import { locationsClaudeSubagentSessionFilePathFindBroker } from './locations-claude-subagent-session-file-path-find-broker';
import { locationsClaudeSubagentSessionFilePathFindBrokerProxy } from './locations-claude-subagent-session-file-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { SessionIdStub } from '../../../contracts/session-id/session-id.stub';
import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsClaudeSubagentSessionFilePathFindBroker', () => {
  describe('subagent session file path resolution', () => {
    it('VALID: {guildPath, sessionId, agentId} => returns sessions-dir/<sessionId>/subagents/agent-<agentId>.jsonl', () => {
      const proxy = locationsClaudeSubagentSessionFilePathFindBrokerProxy();

      proxy.setupSubagentSessionFilePath({
        userHome: '/home/user',
        subagentFilePath: FilePathStub({
          value:
            '/home/user/.claude/projects/-home-user-my-project/abc-123/subagents/agent-xyz.jsonl',
        }),
      });

      const result = locationsClaudeSubagentSessionFilePathFindBroker({
        guildPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
        sessionId: SessionIdStub({ value: 'abc-123' }),
        agentId: AgentIdStub({ value: 'xyz' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value:
            '/home/user/.claude/projects/-home-user-my-project/abc-123/subagents/agent-xyz.jsonl',
        }),
      );
    });
  });
});
