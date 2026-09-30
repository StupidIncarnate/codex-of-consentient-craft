import { locationsClaudeSessionFilePathFindBroker } from './locations-claude-session-file-path-find-broker';
import { locationsClaudeSessionFilePathFindBrokerProxy } from './locations-claude-session-file-path-find-broker.proxy';
import { SessionIdStub } from '../../../contracts/session-id/session-id.stub';

describe('locationsClaudeSessionFilePathFindBroker', () => {
  describe('session file path resolution', () => {
    it('VALID: {guildPath, sessionId} => returns <sessionsDir>/<sessionId>.jsonl', () => {
      const proxy = locationsClaudeSessionFilePathFindBrokerProxy();

      proxy.setupSessionFilePath({ userHome: '/home/user' });

      const result = locationsClaudeSessionFilePathFindBroker({
        guildPath: '/home/user/my-project',
        sessionId: SessionIdStub({ value: 'abc-123' }),
      });

      expect(result).toBe(
        '/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl',
      );
    });
  });
});
