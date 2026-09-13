import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';
import { InstallRepoScaffoldResponderProxy } from './install-repo-scaffold-responder.proxy';

describe('InstallRepoScaffoldResponder', () => {
  describe('fresh repo', () => {
    it('VALID: {no worktrees dir, no .gitignore} => creates the directory and a .gitignore carrying both entries', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupFreshRepo();

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created worktrees/; Created .gitignore with worktrees/, .quest-plans/',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/worktrees']);
      expect(proxy.getWrittenGitignore()).toBe('worktrees/\n.quest-plans/\n');
    });
  });

  describe('directory present, gitignore missing both entries', () => {
    it('VALID: {dir present, .gitignore without either entry} => appends both, does not recreate the dir', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({ gitignoreContent: 'node_modules/\ndist/\n' });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'worktrees/ already present; Added worktrees/, .quest-plans/ to existing .gitignore',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual([]);
      expect(proxy.getWrittenGitignore()).toBe('node_modules/\ndist/\nworktrees/\n.quest-plans/\n');
    });
  });

  describe('one entry present, the other missing', () => {
    it('VALID: {.gitignore ignores worktrees/ only} => appends .quest-plans/ and leaves worktrees/ alone', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({ gitignoreContent: 'node_modules/\nworktrees/\n' });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'worktrees/ already present; Added .quest-plans/ to existing .gitignore; worktrees/ already in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe('node_modules/\nworktrees/\n.quest-plans/\n');
    });

    it('VALID: {.gitignore ignores .quest-plans/ only} => appends worktrees/ and leaves .quest-plans/ alone', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({ gitignoreContent: 'node_modules/\n.quest-plans/\n' });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'worktrees/ already present; Added worktrees/ to existing .gitignore; .quest-plans/ already in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe('node_modules/\n.quest-plans/\nworktrees/\n');
    });
  });

  describe('directory present, gitignore already has both entries', () => {
    it('VALID: {dir present, .gitignore ignores both} => skips, writes nothing', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentAllIgnored({
        gitignoreContent: 'node_modules/\nworktrees/\n.quest-plans/\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/, .quest-plans/ already in .gitignore',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual([]);
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('directory missing, gitignore already has both entries', () => {
    it('VALID: {dir missing, .gitignore ignores both} => creates the dir, writes nothing', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirMissingAllIgnored({
        gitignoreContent: 'node_modules/\nworktrees/\n.quest-plans/\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created worktrees/; worktrees/, .quest-plans/ already in .gitignore',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/worktrees']);
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('substring-vs-line trap', () => {
    it('EDGE: {.gitignore has ".claude/worktrees" line, not the exact entry} => still appends worktrees/', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({ gitignoreContent: '.claude/worktrees\n.quest-plans/\n' });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'worktrees/ already present; Added worktrees/ to existing .gitignore; .quest-plans/ already in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe('.claude/worktrees\n.quest-plans/\nworktrees/\n');
    });
  });

  describe('no trailing newline on existing content', () => {
    it('EDGE: {.gitignore has no trailing newline} => appended entries land on their own lines', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({ gitignoreContent: 'node_modules/\ndist' });

      await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(proxy.getWrittenGitignore()).toBe('node_modules/\ndist\nworktrees/\n.quest-plans/\n');
    });
  });

  describe('bare entry with no trailing slash', () => {
    it('EDGE: {.gitignore has bare "worktrees" and ".quest-plans" lines} => treated as already ignoring, writes nothing', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentAllIgnored({
        gitignoreContent: 'node_modules/\nworktrees\n.quest-plans\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/, .quest-plans/ already in .gitignore',
      });
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('entry with leading whitespace', () => {
    it('EDGE: {.gitignore has "  worktrees/  " with LEADING whitespace} => not already ignoring, appends a real entry', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({
        gitignoreContent: 'node_modules/\n  worktrees/  \n.quest-plans/\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'worktrees/ already present; Added worktrees/ to existing .gitignore; .quest-plans/ already in .gitignore',
      });
      // The leading-whitespace line keeps its own trailing spaces: only the WHOLE content is
      // trimEnd-ed before the append, and this line is no longer the last one.
      expect(proxy.getWrittenGitignore()).toBe(
        'node_modules/\n  worktrees/  \n.quest-plans/\nworktrees/\n',
      );
    });

    it('EDGE: {.gitignore has "   .quest-plans/" with LEADING whitespace} => not already ignoring, appends a real entry', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentEntryMissing({
        gitignoreContent: 'worktrees/\n   .quest-plans/\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'worktrees/ already present; Added .quest-plans/ to existing .gitignore; worktrees/ already in .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe('worktrees/\n   .quest-plans/\n.quest-plans/\n');
    });
  });

  describe('entry with trailing whitespace only', () => {
    it('EDGE: {.gitignore has "worktrees/   " with TRAILING whitespace only} => treated as already ignoring, writes nothing', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentAllIgnored({
        gitignoreContent: 'node_modules/\nworktrees/   \n.quest-plans/  \ndist/\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/, .quest-plans/ already in .gitignore',
      });
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('CRLF line endings', () => {
    it('EDGE: {.gitignore is CRLF-terminated and carries both entries} => treated as already ignoring, writes nothing', async () => {
      const proxy = InstallRepoScaffoldResponderProxy();
      proxy.setupDirPresentAllIgnored({
        gitignoreContent: 'node_modules/\r\nworktrees/\r\n.quest-plans/\r\ndist/\r\n',
      });

      const result = await proxy.callResponder({
        context: InstallContextStub({
          value: {
            targetProjectRoot: FilePathStub({ value: '/project' }),
            dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
          },
        }),
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/, .quest-plans/ already in .gitignore',
      });
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });
});
