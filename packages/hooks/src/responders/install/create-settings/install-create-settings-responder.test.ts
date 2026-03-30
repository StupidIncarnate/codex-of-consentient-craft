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

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write|Edit|MultiEdit',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
            },
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-bash' }],
            },
          ],
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
            },
          ],
          WorktreeCreate: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }],
            },
          ],
        },
      });
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

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        tools: { Write: { enabled: true } },
        hooks: {
          PreToolUse: [
            {
              matcher: 'Write|Edit|MultiEdit',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
            },
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-bash' }],
            },
          ],
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
            },
          ],
          WorktreeCreate: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }],
            },
          ],
        },
      });
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

      const written = JSON.parse(String(proxy.getWrittenContent())) as Record<PropertyKey, unknown>;

      expect(written).toStrictEqual({
        hooks: {
          PreToolUse: [
            { hooks: [{ command: 'existing-hook' }] },
            {
              matcher: 'Write|Edit|MultiEdit',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-edit-lint' }],
            },
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-bash' }],
            },
          ],
          SessionStart: [
            { hooks: [{ command: 'existing-session-hook' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
            },
          ],
          WorktreeCreate: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-worktree-create' }],
            },
          ],
        },
      });
    });
  });
});
