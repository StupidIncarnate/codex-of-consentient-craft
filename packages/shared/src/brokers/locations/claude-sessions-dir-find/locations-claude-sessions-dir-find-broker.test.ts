import { locationsClaudeSessionsDirFindBroker } from './locations-claude-sessions-dir-find-broker';
import { locationsClaudeSessionsDirFindBrokerProxy } from './locations-claude-sessions-dir-find-broker.proxy';

describe('locationsClaudeSessionsDirFindBroker', () => {
  describe('sessions dir resolution', () => {
    it('VALID: {guildPath: "/home/user/my-project"} => returns /home/user/.claude/projects/-home-user-my-project', () => {
      const proxy = locationsClaudeSessionsDirFindBrokerProxy();

      proxy.setupSessionsDir({
        userHome: '/home/user',
      });

      const result = locationsClaudeSessionsDirFindBroker({
        guildPath: '/home/user/my-project',
      });

      expect(result).toBe('/home/user/.claude/projects/-home-user-my-project');
    });
  });
});
