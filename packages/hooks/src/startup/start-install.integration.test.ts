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
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
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
            {
              matcher: 'Grep|Glob',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-search' }],
            },
          ],
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
            },
          ],
          SubagentStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-subagent-start-hook' }],
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
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
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

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
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
            {
              matcher: 'Grep|Glob',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-search' }],
            },
          ],
          SessionStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
            },
          ],
          SubagentStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-subagent-start-hook' }],
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
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
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
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
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

      const parsed = JSON.parse(settingsContent!) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
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
            {
              matcher: 'Grep|Glob',
              hooks: [{ type: 'command', command: 'dungeonmaster-pre-search' }],
            },
          ],
          SessionStart: [
            { hooks: [{ command: 'existing-session-hook' }] },
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-session-start-hook' }],
            },
          ],
          SubagentStart: [
            {
              hooks: [{ type: 'command', command: 'dungeonmaster-subagent-start-hook' }],
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
