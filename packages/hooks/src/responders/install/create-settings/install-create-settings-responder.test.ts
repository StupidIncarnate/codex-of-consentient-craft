import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { InstallCreateSettingsResponderProxy } from './install-create-settings-responder.proxy';

describe('InstallCreateSettingsResponder', () => {
  describe('no existing settings', () => {
    it('VALID: {no existing settings file} => creates settings.json with hooks', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupNoExistingSettings();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });

      const written = String(proxy.getWrittenContent());

      expect(written).toContain('dungeonmaster-pre-edit-lint');
      expect(written).toContain('dungeonmaster-session-start');
      expect(written).toContain('dungeonmaster-pre-bash');
      expect(written).toContain('dungeonmaster-worktree-create');
    });
  });

  describe('existing settings without dungeonmaster', () => {
    it('VALID: {existing settings without dungeonmaster} => merges hooks into existing settings', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: FileContentsStub({
          value: JSON.stringify({ tools: { Write: { enabled: true } } }, null, 2),
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const written = String(proxy.getWrittenContent());

      expect(written).toContain('Write');
      expect(written).toContain('enabled');
      expect(written).toContain('dungeonmaster-pre-edit-lint');
    });
  });

  describe('dungeonmaster hooks already present', () => {
    it('VALID: {settings already has dungeonmaster hooks} => skips installation', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: FileContentsStub({
          value: JSON.stringify(
            {
              hooks: {
                PreToolUse: [{ hooks: [{ command: 'dungeonmaster-pre-edit-lint' }] }],
              },
            },
            null,
            2,
          ),
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'skipped',
        message: 'Hooks already configured',
      });
    });
  });

  describe('existing settings with other hooks', () => {
    it('VALID: {existing settings with other hooks} => preserves existing hooks when merging', async () => {
      const proxy = InstallCreateSettingsResponderProxy();

      proxy.setupExistingSettings({
        content: FileContentsStub({
          value: JSON.stringify(
            {
              hooks: {
                PreToolUse: [{ hooks: [{ command: 'existing-hook' }] }],
                SessionStart: [{ hooks: [{ command: 'existing-session-hook' }] }],
              },
            },
            null,
            2,
          ),
        }),
      });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const written = String(proxy.getWrittenContent());

      expect(written).toContain('existing-hook');
      expect(written).toContain('existing-session-hook');
      expect(written).toContain('dungeonmaster-pre-edit-lint');
    });
  });
});
