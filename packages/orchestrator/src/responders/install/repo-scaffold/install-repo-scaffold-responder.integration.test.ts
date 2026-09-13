import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';
import { InstallRepoScaffoldResponder } from './install-repo-scaffold-responder';

describe('InstallRepoScaffoldResponder', () => {
  describe('real filesystem, fresh repo', () => {
    it('VALID: {no worktrees dir, no .gitignore} => .gitignore holds both lines and only worktrees/ is created', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-repo-scaffold-fresh' }),
      });

      const result = await InstallRepoScaffoldResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });

      const gitignoreContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });
      const worktreesEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: 'worktrees' }),
      });
      const questPlansEntries = testbed.listDir({
        relativePath: RelativePathStub({ value: '.quest-plans' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created worktrees/; Created .gitignore with worktrees/, .quest-plans/',
      });
      expect(gitignoreContent).toBe('worktrees/\n.quest-plans/\n');
      expect(worktreesEntries).toStrictEqual([]);
      // listDir answers null for a path that is not on disk: `.quest-plans/` is ignored but never
      // created, so an `init` in a repo no operator has run leaves no empty directory behind.
      expect(questPlansEntries).toBe(null);
    });
  });

  describe('real filesystem, repo already carrying one entry', () => {
    it('VALID: {.gitignore ignores worktrees/ only} => the second entry is appended and the first is not duplicated', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-repo-scaffold-partial' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/\nworktrees/\n' }),
      });

      const result = await InstallRepoScaffoldResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
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
          'Created worktrees/; Added .quest-plans/ to existing .gitignore; worktrees/ already in .gitignore',
      });
      expect(gitignoreContent).toBe('node_modules/\nworktrees/\n.quest-plans/\n');
    });
  });

  describe('real filesystem, run twice', () => {
    it('VALID: {responder run twice} => .gitignore holds each entry exactly once and the second run reports it skipped', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-repo-scaffold-twice' }),
      });

      await InstallRepoScaffoldResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });
      const afterFirstRun = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      const secondResult = await InstallRepoScaffoldResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
      });
      const afterSecondRun = testbed.readFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
      });

      testbed.cleanup();

      expect(afterFirstRun).toBe('worktrees/\n.quest-plans/\n');
      expect(afterSecondRun).toBe('worktrees/\n.quest-plans/\n');
      expect(secondResult).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/, .quest-plans/ already in .gitignore',
      });
    });
  });

  describe('real filesystem, leading whitespace on an entry', () => {
    it('EDGE: {.gitignore has "   worktrees/" with LEADING whitespace} => a real worktrees/ line is appended below it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-repo-scaffold-leading-ws' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules/\n   worktrees/\n.quest-plans/\n' }),
      });

      const result = await InstallRepoScaffoldResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
            dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
          },
        }),
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
          'Created worktrees/; Added worktrees/ to existing .gitignore; .quest-plans/ already in .gitignore',
      });
      expect(gitignoreContent).toBe('node_modules/\n   worktrees/\n.quest-plans/\nworktrees/\n');
    });
  });
});
