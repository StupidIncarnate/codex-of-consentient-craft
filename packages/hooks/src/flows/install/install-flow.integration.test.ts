import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context: no existing settings} => delegates to responder and creates settings', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'hooks-flow-create' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });

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
              matcher: 'Grep|Glob|Search|Find',
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
  });
});
