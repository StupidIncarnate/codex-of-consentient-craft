import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallWorktreesScaffoldResponderProxy } from './install-worktrees-scaffold-responder.proxy';

describe('InstallWorktreesScaffoldResponder', () => {
  describe('fresh repo', () => {
    it('VALID: {no worktrees dir, no .gitignore} => creates the directory and a fresh .gitignore', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupFreshRepo();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created worktrees/; Created .gitignore with worktrees/',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/worktrees']);
      expect(proxy.getWrittenGitignore()).toBe('worktrees/\n');
    });
  });

  describe('directory present, gitignore missing the entry', () => {
    it('VALID: {dir present, .gitignore without entry} => appends the entry, does not recreate the dir', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirPresentNoEntry({ gitignoreContent: 'node_modules/\ndist/\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'worktrees/ already present; Added worktrees/ to existing .gitignore',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual([]);
      expect(proxy.getWrittenGitignore()).toBe('node_modules/\ndist/\nworktrees/\n');
    });
  });

  describe('directory present, gitignore already has the entry', () => {
    it('VALID: {dir present, .gitignore already ignores worktrees/} => skips, writes nothing', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirPresentAlreadyIgnored({ gitignoreContent: 'node_modules/\nworktrees/\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/ already in .gitignore',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual([]);
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('directory missing, gitignore already has the entry', () => {
    it('VALID: {dir missing, .gitignore already ignores worktrees/} => creates the dir, writes nothing', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirMissingAlreadyIgnored({ gitignoreContent: 'node_modules/\nworktrees/\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created worktrees/; worktrees/ already in .gitignore',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/worktrees']);
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('substring-vs-line trap', () => {
    it('EDGE: {.gitignore has ".claude/worktrees" line, not the exact entry} => still appends worktrees/', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirPresentNoEntry({ gitignoreContent: '.claude/worktrees\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'worktrees/ already present; Added worktrees/ to existing .gitignore',
      });
      expect(proxy.getWrittenGitignore()).toBe('.claude/worktrees\nworktrees/\n');
    });
  });

  describe('no trailing newline on existing content', () => {
    it('EDGE: {.gitignore has no trailing newline} => appended entry lands on its own line', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirPresentNoEntry({ gitignoreContent: 'node_modules/\ndist' });

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(proxy.getWrittenGitignore()).toBe('node_modules/\ndist\nworktrees/\n');
    });
  });

  describe('bare entry with no trailing slash', () => {
    it('EDGE: {.gitignore has bare "worktrees" line} => treated as already ignoring, writes nothing', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirPresentAlreadyIgnored({ gitignoreContent: 'node_modules/\nworktrees\n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/ already in .gitignore',
      });
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('entry with surrounding whitespace', () => {
    it('EDGE: {.gitignore has "  worktrees/  " with surrounding whitespace} => treated as already ignoring, writes nothing', async () => {
      const proxy = InstallWorktreesScaffoldResponderProxy();
      proxy.setupDirPresentAlreadyIgnored({ gitignoreContent: 'node_modules/\n  worktrees/  \n' });

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'skipped',
        message: 'worktrees/ already present; worktrees/ already in .gitignore',
      });
      expect(proxy.getAllWrittenFiles()).toStrictEqual([]);
    });
  });
});
