import { locationsClaudeProjectsRootFindBroker } from './locations-claude-projects-root-find-broker';
import { locationsClaudeProjectsRootFindBrokerProxy } from './locations-claude-projects-root-find-broker.proxy';

describe('locationsClaudeProjectsRootFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.claude/projects', () => {
    const proxy = locationsClaudeProjectsRootFindBrokerProxy();

    proxy.setupProjectsRoot({
      homeDir: '/home/user',
    });

    const result = locationsClaudeProjectsRootFindBroker();

    expect(result).toBe('/home/user/.claude/projects');
  });
});
