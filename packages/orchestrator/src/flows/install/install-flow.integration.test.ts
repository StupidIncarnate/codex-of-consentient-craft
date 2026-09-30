import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { slashCommandsStatics } from '../../statics/slash-commands/slash-commands-statics';
import { InstallFlow } from './install-flow';
import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

describe('InstallFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {context} => writes dumpster slash commands and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'orchestrator-flow-commands',
      });

      const result = await InstallFlow({
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
    });
  });

  describe('repo scaffold', () => {
    it('VALID: {no worktrees dir, no .gitignore} => creates an empty worktrees/ and a .gitignore ignoring it and .quest-plans/', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'orchestrator-flow-scaffold-fresh',
      });

      await InstallFlow({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });

      const worktreesEntries = testbed.listDir({
        relativePath: 'worktrees',
      });
      const gitignoreContent = testbed.readFile({
        relativePath: '.gitignore',
      });

      testbed.cleanup();

      expect(worktreesEntries).toStrictEqual([]);
      expect(gitignoreContent).toBe('worktrees/\n.quest-plans/\n');
    });

    it('VALID: {worktrees dir already holds quest checkouts, no gitignore entry} => appends the entry and leaves the checkouts untouched', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'orchestrator-flow-scaffold-preexisting',
      });

      // Written in reverse-alphabetical order so the listing below asserts sorted entries
      // rather than whatever order the filesystem hands readdir back.
      testbed.writeFile({
        relativePath: 'worktrees/quest-zap-cache-9f3c1a20/marker.txt',
        content: 'second quest checkout',
      });
      testbed.writeFile({
        relativePath: 'worktrees/quest-add-auth-7bc217a1/marker.txt',
        content: 'quest checkout contents',
      });
      testbed.writeFile({
        relativePath: '.gitignore',
        content: 'node_modules/\n.claude/worktrees\n',
      });

      const result = await InstallFlow({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });

      const worktreesEntries = testbed.listDir({
        relativePath: 'worktrees',
      });
      const markerContent = testbed.readFile({
        relativePath: 'worktrees/quest-add-auth-7bc217a1/marker.txt',
      });
      const gitignoreContent = testbed.readFile({
        relativePath: '.gitignore',
      });

      testbed.cleanup();

      expect(result.message).toBe(
        'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-hunt.md; worktrees/ already present; Added worktrees/, .quest-plans/ to existing .gitignore',
      );
      expect(worktreesEntries).toStrictEqual([
        'quest-add-auth-7bc217a1',
        'quest-zap-cache-9f3c1a20',
      ]);
      expect(markerContent).toBe('quest checkout contents');
      expect(gitignoreContent).toBe(
        'node_modules/\n.claude/worktrees\nworktrees/\n.quest-plans/\n',
      );
    });

    it('VALID: {flow run twice} => .gitignore holds exactly one line per entry and the second run reports them skipped', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'orchestrator-flow-scaffold-twice',
      });

      testbed.writeFile({
        relativePath: '.gitignore',
        content: 'node_modules/',
      });

      await InstallFlow({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });
      const afterFirstRun = testbed.readFile({
        relativePath: '.gitignore',
      });

      const secondResult = await InstallFlow({
        context: InstallContextStub({ value: {
          targetProjectRoot: testbed.guildPath,
          dungeonmasterRoot: testbed.dungeonmasterPath,
        } }),
      });
      const afterSecondRun = testbed.readFile({
        relativePath: '.gitignore',
      });

      testbed.cleanup();

      expect(afterFirstRun).toBe('node_modules/\nworktrees/\n.quest-plans/\n');
      expect(afterSecondRun).toBe('node_modules/\nworktrees/\n.quest-plans/\n');
      expect(secondResult.message).toBe(
        'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-hunt.md; worktrees/ already present; worktrees/, .quest-plans/ already in .gitignore',
      );
    });
  });
});
