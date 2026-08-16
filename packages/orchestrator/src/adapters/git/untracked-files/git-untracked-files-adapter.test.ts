import { AbsoluteFilePathStub, RepoRelativePathStub } from '@dungeonmaster/shared/contracts';

import { gitUntrackedFilesAdapter } from './git-untracked-files-adapter';
import { gitUntrackedFilesAdapterProxy } from './git-untracked-files-adapter.proxy';

describe('gitUntrackedFilesAdapter', () => {
  describe('valid ls-files output', () => {
    it('VALID: {multi-file output} => returns RepoRelativePath[] in git order', async () => {
      const proxy = gitUntrackedFilesAdapterProxy();
      proxy.setupUntrackedOutput({
        output:
          'packages/orchestrator/src/statics/new-thing/new-thing-statics.ts\npackages/orchestrator/src/statics/new-thing/new-thing-statics.test.ts\n',
      });

      const result = await gitUntrackedFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({
          value: 'packages/orchestrator/src/statics/new-thing/new-thing-statics.ts',
        }),
        RepoRelativePathStub({
          value: 'packages/orchestrator/src/statics/new-thing/new-thing-statics.test.ts',
        }),
      ]);
    });

    it('VALID: {single file, no trailing newline} => returns one RepoRelativePath', async () => {
      const proxy = gitUntrackedFilesAdapterProxy();
      proxy.setupUntrackedOutput({ output: 'packages/orchestrator/src/index.ts' });

      const result = await gitUntrackedFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({ value: 'packages/orchestrator/src/index.ts' }),
      ]);
    });
  });

  describe('empty output', () => {
    it('EMPTY: {no untracked files} => returns []', async () => {
      const proxy = gitUntrackedFilesAdapterProxy();
      proxy.setupUntrackedOutput({ output: '' });

      const result = await gitUntrackedFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {blank lines and trailing newline} => returns []', async () => {
      const proxy = gitUntrackedFilesAdapterProxy();
      proxy.setupUntrackedOutput({ output: '\n\n  \n' });

      const result = await gitUntrackedFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('spawned git argv', () => {
    // --exclude-standard is the whole difference between a review surface and a dump of
    // node_modules; asserting the exact argv is what stops it being dropped.
    it('VALID: {cwd} => spawns git ls-files --others --exclude-standard in that cwd', async () => {
      const proxy = gitUntrackedFilesAdapterProxy();
      proxy.setupUntrackedOutput({ output: '' });

      await gitUntrackedFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/home/testuser/worktrees/quest-abc12345' }),
      });

      expect({ args: proxy.getSpawnedArgs(), cwd: proxy.getSpawnedCwd() }).toStrictEqual({
        args: ['ls-files', '--others', '--exclude-standard'],
        cwd: '/home/testuser/worktrees/quest-abc12345',
      });
    });
  });

  describe('non-zero git exit', () => {
    it('ERROR: {git exits non-zero} => throws an error naming the command, exit code, and output', async () => {
      const proxy = gitUntrackedFilesAdapterProxy();
      proxy.setupFailure({ output: 'fatal: not a git repository' });

      await expect(
        gitUntrackedFilesAdapter({ cwd: AbsoluteFilePathStub({ value: '/project' }) }),
      ).rejects.toThrow(
        /^git ls-files --others --exclude-standard failed with exit code 128: fatal: not a git repository$/u,
      );
    });
  });
});
