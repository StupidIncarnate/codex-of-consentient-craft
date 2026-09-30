import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { slashCommandsStatics } from '../statics/slash-commands/slash-commands-statics';
import { StartInstall } from './start-install';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow, writes commands, scaffolds the repo root, and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'orchestrator-start-install',
      });

      const result = await StartInstall({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });

      const createContent = testbed.readFile({
        relativePath: '.claude/commands/dumpster-create.md',
      });
      const huntContent = testbed.readFile({
        relativePath: '.claude/commands/dumpster-hunt.md',
      });
      const commandFiles = testbed.listDir({
        relativePath: '.claude/commands',
      });
      const worktreesEntries = testbed.listDir({
        relativePath: 'worktrees',
      });
      const gitignoreContent = testbed.readFile({
        relativePath: '.gitignore',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-hunt.md; Created worktrees/; Created .gitignore with worktrees/, .quest-plans/',
      });

      expect(createContent).toBe(slashCommandsStatics.dumpsterCreate.body);
      expect(huntContent).toBe(slashCommandsStatics.dumpsterHunt.body);
      expect(commandFiles).toStrictEqual(['dumpster-create.md', 'dumpster-hunt.md']);
      expect(worktreesEntries).toStrictEqual([]);
      expect(gitignoreContent).toBe('worktrees/\n.quest-plans/\n');
    });
  });
});
