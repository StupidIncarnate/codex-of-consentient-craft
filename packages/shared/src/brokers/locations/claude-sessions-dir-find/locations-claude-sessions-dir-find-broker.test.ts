import { locationsClaudeSessionsDirFindBroker } from './locations-claude-sessions-dir-find-broker';
import { locationsClaudeSessionsDirFindBrokerProxy } from './locations-claude-sessions-dir-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsClaudeSessionsDirFindBroker', () => {
  describe('sessions dir resolution', () => {
    it('VALID: {guildPath: "/home/user/my-project"} => returns /home/user/.claude/projects/-home-user-my-project', () => {
      const proxy = locationsClaudeSessionsDirFindBrokerProxy();

      proxy.setupSessionsDir({
        userHome: '/home/user',
      });

      const result = locationsClaudeSessionsDirFindBroker({
        guildPath: AbsoluteFilePathStub({ value: '/home/user/my-project' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.claude/projects/-home-user-my-project' }),
      );
    });
  });
});
