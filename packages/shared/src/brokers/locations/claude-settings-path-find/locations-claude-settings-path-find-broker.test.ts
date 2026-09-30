import { locationsClaudeSettingsPathFindBroker } from './locations-claude-settings-path-find-broker';
import { locationsClaudeSettingsPathFindBrokerProxy } from './locations-claude-settings-path-find-broker.proxy';

describe('locationsClaudeSettingsPathFindBroker', () => {
  describe('shared kind', () => {
    it('VALID: {startPath: "/project/src", kind: "shared"} => returns /project/.claude/settings.json', async () => {
      const proxy = locationsClaudeSettingsPathFindBrokerProxy();
      const startPath = '/project/src';

      proxy.setupSettingsPath({
        startPath: '/project/src',
        configRootPath: '/project',
      });

      const result = await locationsClaudeSettingsPathFindBroker({
        startPath,
        kind: 'shared',
      });

      expect(result).toBe('/project/.claude/settings.json');
    });
  });

  describe('local kind', () => {
    it('VALID: {startPath: "/project/src", kind: "local"} => returns /project/.claude/settings.local.json', async () => {
      const proxy = locationsClaudeSettingsPathFindBrokerProxy();
      const startPath = '/project/src';

      proxy.setupSettingsPath({
        startPath: '/project/src',
        configRootPath: '/project',
      });

      const result = await locationsClaudeSettingsPathFindBroker({
        startPath,
        kind: 'local',
      });

      expect(result).toBe('/project/.claude/settings.local.json');
    });
  });
});
