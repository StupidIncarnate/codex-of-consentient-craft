import {
  AbsoluteFilePathStub,
  QuestStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';

import { gitDiffFilesAdapter } from './git-diff-files-adapter';
import { gitDiffFilesAdapterProxy } from './git-diff-files-adapter.proxy';

describe('gitDiffFilesAdapter', () => {
  describe('valid diff output', () => {
    it('VALID: {multi-file diff output} => returns RepoRelativePath[] in git order', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: 'src/file1.ts\nsrc/file2.ts\nsrc/file3.ts\n' });
      const baseRef = QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!;

      const result = await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({ value: 'src/file1.ts' }),
        RepoRelativePathStub({ value: 'src/file2.ts' }),
        RepoRelativePathStub({ value: 'src/file3.ts' }),
      ]);
    });

    it('VALID: {single-file diff output, no trailing newline} => returns single RepoRelativePath', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: 'packages/orchestrator/src/index.ts' });
      const baseRef = QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!;

      const result = await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({ value: 'packages/orchestrator/src/index.ts' }),
      ]);
    });
  });

  describe('empty diff output', () => {
    it('EMPTY: {empty diff output} => returns []', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: '' });
      const baseRef = QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!;

      const result = await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {blank lines and trailing newline} => returns []', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: '\n\n  \n' });
      const baseRef = QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!;

      const result = await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('spawned git argv', () => {
    it('VALID: {baseRef} => spawns git diff with three-dot range and --name-only', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: '' });
      const baseRef = QuestStub({ baseRef: 'deadbeef' as never }).baseRef!;

      await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['diff', 'deadbeef...HEAD', '--name-only']);
    });

    it("VALID: {comparison: 'merge-base-to-head'} => spawns the same three-dot range as omitting it", async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: '' });
      const baseRef = QuestStub({ baseRef: 'deadbeef' as never }).baseRef!;

      await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
        comparison: 'merge-base-to-head',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['diff', 'deadbeef...HEAD', '--name-only']);
    });

    // `HEAD...HEAD` is empty by construction, so a working-tree reading cannot use the range form
    // at all — the ref has to arrive bare.
    it("VALID: {comparison: 'ref-to-working-tree'} => spawns git diff with the bare ref and no range", async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: '' });
      const baseRef = QuestStub({ baseRef: 'HEAD' as never }).baseRef!;

      await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
        comparison: 'ref-to-working-tree',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['diff', 'HEAD', '--name-only']);
    });
  });

  describe("comparison: 'ref-to-working-tree'", () => {
    it('VALID: {tracked modifications} => returns them, in git order', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupDiffOutput({ output: 'src/file1.ts\nsrc/file2.ts\n' });
      const baseRef = QuestStub({ baseRef: 'HEAD' as never }).baseRef!;

      const result = await gitDiffFilesAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        baseRef,
        comparison: 'ref-to-working-tree',
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({ value: 'src/file1.ts' }),
        RepoRelativePathStub({ value: 'src/file2.ts' }),
      ]);
    });

    it('ERROR: {git exits non-zero} => the thrown message names the bare ref, not a range it never ran', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupFailure({ output: 'fatal: bad revision' });
      const baseRef = QuestStub({ baseRef: 'HEAD' as never }).baseRef!;

      await expect(
        gitDiffFilesAdapter({
          cwd: AbsoluteFilePathStub({ value: '/project' }),
          baseRef,
          comparison: 'ref-to-working-tree',
        }),
      ).rejects.toThrow(/^git diff HEAD failed with exit code 1: fatal: bad revision$/u);
    });
  });

  describe('non-zero git exit', () => {
    it('ERROR: {git exits non-zero} => throws an error naming the ref, exit code, and output', async () => {
      const proxy = gitDiffFilesAdapterProxy();
      proxy.setupFailure({ output: 'fatal: bad revision' });
      const baseRef = QuestStub({ baseRef: 'deadbeef' as never }).baseRef!;

      await expect(
        gitDiffFilesAdapter({
          cwd: AbsoluteFilePathStub({ value: '/project' }),
          baseRef,
        }),
      ).rejects.toThrow(
        /^git diff deadbeef\.\.\.HEAD failed with exit code 1: fatal: bad revision$/u,
      );
    });
  });
});
