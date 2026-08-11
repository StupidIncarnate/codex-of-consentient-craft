import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { slashCommandsStatics } from '../../statics/slash-commands/slash-commands-statics';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responders', () => {
    it('VALID: {context} => writes dumpster slash commands and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-flow-commands' }),
      });

      const result = await InstallFlow({
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
    });
  });

  describe('worktrees scaffold', () => {
    it('VALID: {no worktrees dir, no .gitignore} => creates an empty worktrees/ and a .gitignore ignoring it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-flow-scaffold-fresh' }),
      });

      await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const worktreesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'worktrees' }),
      });
      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(worktreesEntries).toStrictEqual([]);
      expect(gitignoreContent).toBe('worktrees/\n');
    });

    it('VALID: {worktrees dir already holds quest checkouts, no gitignore entry} => appends the entry and leaves the checkouts untouched', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-flow-scaffold-preexisting' }),
      });

      // Written in reverse-alphabetical order so the listing below asserts sorted entries
      // rather than whatever order the filesystem hands readdir back.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'worktrees/quest-zap-cache-9f3c1a20/marker.txt' }),
        content: FileContentStub({ value: 'second quest checkout' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'worktrees/quest-add-auth-7bc217a1/marker.txt' }),
        content: FileContentStub({ value: 'quest checkout contents' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/\n.claude/worktrees\n' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const worktreesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'worktrees' }),
      });
      const markerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'worktrees/quest-add-auth-7bc217a1/marker.txt' }),
      });
      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(result.message).toBe(
        'Created .claude/commands/dumpster-create.md, .claude/commands/dumpster-hunt.md, and .claude/commands/dumpster-launch.md; worktrees/ already present; Added worktrees/ to existing .gitignore',
      );
      expect(worktreesEntries).toStrictEqual([
        'quest-add-auth-7bc217a1',
        'quest-zap-cache-9f3c1a20',
      ]);
      expect(markerContent).toBe('quest checkout contents');
      expect(gitignoreContent).toBe('node_modules/\n.claude/worktrees\nworktrees/\n');
    });

    it('VALID: {flow run twice} => .gitignore holds exactly one worktrees/ line and the second run reports it skipped', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-flow-scaffold-twice' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/' }),
      });

      await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });
      const afterFirstRun = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      const secondResult = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });
      const afterSecondRun = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(afterFirstRun).toBe('node_modules/\nworktrees/\n');
      expect(afterSecondRun).toBe('node_modules/\nworktrees/\n');
      expect(secondResult.message).toBe(
        'Created .claude/commands/dumpster-create.md, .claude/commands/dumpster-hunt.md, and .claude/commands/dumpster-launch.md; worktrees/ already present; worktrees/ already in .gitignore',
      );
    });
  });
});
