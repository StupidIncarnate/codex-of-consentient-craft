import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { slashCommandsStatics } from '../statics/slash-commands/slash-commands-statics';
import { StartInstall } from './start-install';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow, writes commands, scaffolds worktrees, and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-start-install' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const createContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-create.md' }),
      });
      const huntContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-hunt.md' }),
      });
      const launchContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-launch.md' }),
      });
      const worktreesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'worktrees' }),
      });
      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'Created .claude/commands/dumpster-create.md, .claude/commands/dumpster-hunt.md, and .claude/commands/dumpster-launch.md; Created worktrees/; Created .gitignore with worktrees/',
      });

      expect(createContent).toBe(slashCommandsStatics.dumpsterCreate.body);
      expect(huntContent).toBe(slashCommandsStatics.dumpsterHunt.body);
      expect(launchContent).toBe(slashCommandsStatics.dumpsterLaunch.body);
      expect(worktreesEntries).toStrictEqual([]);
      expect(gitignoreContent).toBe('worktrees/\n');
    });
  });
});
