import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing settings} => creates settings.json with hooks', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-hooks' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });

      const settings = testbed.getClaudeSettings();

      expect(settings).not.toBeNull();

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(settingsContent).toMatch(/dungeonmaster-pre-edit-lint/u);
      expect(settingsContent).toMatch(/dungeonmaster-session-start/u);
    });

    it('VALID: {context: existing settings without dungeonmaster} => merges hooks into existing settings', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'merge-hooks' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
        content: FileContentStub({
          value: JSON.stringify({ tools: { Write: { enabled: true } } }, null, 2),
        }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(settingsContent).toMatch(/Write/u);
      expect(settingsContent).toMatch(/enabled/u);
      expect(settingsContent).toMatch(/dungeonmaster-pre-edit-lint/u);
    });

    it('VALID: {context: settings already has dungeonmaster hooks} => skips installation', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-hooks' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
        content: FileContentStub({
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

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'skipped',
        message: 'Hooks already configured',
      });
    });

    it('VALID: {context: existing settings with other hooks} => preserves existing hooks when merging', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'preserve-hooks' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
        content: FileContentStub({
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

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'merged',
        message: 'Merged hooks into existing settings',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(settingsContent).toMatch(/existing-hook/u);
      expect(settingsContent).toMatch(/existing-session-hook/u);
      expect(settingsContent).toMatch(/dungeonmaster-pre-edit-lint/u);
    });
  });
});
