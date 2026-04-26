import { locationsClaudeSessionFilePathFindBroker } from './locations-claude-session-file-path-find-broker';
import { locationsClaudeSessionFilePathFindBrokerProxy } from './locations-claude-session-file-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { SessionIdStub } from '../../../contracts/session-id/session-id.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsClaudeSessionFilePathFindBroker', () => {
  describe('session file path resolution', () => {
    it('VALID: {guildPath, sessionId} => returns <sessionsDir>/<sessionId>.jsonl', () => {
      const proxy = locationsClaudeSessionFilePathFindBrokerProxy();

      proxy.setupSessionFilePath({
        userHome: '/home/user',
        sessionFilePath: FilePathStub({
          value: '/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl',
        }),
      });

      const result = locationsClaudeSessionFilePathFindBroker({
        guildPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
        sessionId: SessionIdStub({ value: 'abc-123' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.claude/projects/-home-user-my-project/abc-123.jsonl',
        }),
      );
    });
  });
});
