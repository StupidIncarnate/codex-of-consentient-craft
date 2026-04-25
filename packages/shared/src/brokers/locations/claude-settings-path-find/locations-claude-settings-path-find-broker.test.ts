import { locationsClaudeSettingsPathFindBroker } from './locations-claude-settings-path-find-broker';
import { locationsClaudeSettingsPathFindBrokerProxy } from './locations-claude-settings-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsClaudeSettingsPathFindBroker', () => {
  describe('shared kind', () => {
    it('VALID: {startPath: "/project/src", kind: "shared"} => returns /project/.claude/settings.json', async () => {
      const proxy = locationsClaudeSettingsPathFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSettingsPath({
        startPath: '/project/src',
        configRootPath: '/project',
        settingsPath: FilePathStub({ value: '/project/.claude/settings.json' }),
      });

      const result = await locationsClaudeSettingsPathFindBroker({
        startPath,
        kind: 'shared',
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/.claude/settings.json' }));
    });
  });

  describe('local kind', () => {
    it('VALID: {startPath: "/project/src", kind: "local"} => returns /project/.claude/settings.local.json', async () => {
      const proxy = locationsClaudeSettingsPathFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSettingsPath({
        startPath: '/project/src',
        configRootPath: '/project',
        settingsPath: FilePathStub({ value: '/project/.claude/settings.local.json' }),
      });

      const result = await locationsClaudeSettingsPathFindBroker({
        startPath,
        kind: 'local',
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/project/.claude/settings.local.json' }));
    });
  });
});
