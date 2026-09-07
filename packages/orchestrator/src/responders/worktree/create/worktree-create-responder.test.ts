import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WorktreeCreateResponder } from './worktree-create-responder';
import { WorktreeCreateResponderProxy } from './worktree-create-responder.proxy';

describe('WorktreeCreateResponder', () => {
  describe('a name nothing has carved yet', () => {
    it('VALID: {name: probe} => carves off the detected base branch and returns the path under worktrees/', async () => {
      const proxy = WorktreeCreateResponderProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });
      proxy.setupFreshCarve({
        repoRoot,
        worktreePath,
        name: 'probe',
        sha: '1234567890abcdef1234567890abcdef12345678',
      });

      const result = await WorktreeCreateResponder({ name: 'probe' });

      expect(result).toStrictEqual({ worktreePath: '/repo/worktrees/probe' });
      // The base-branch probe FIRST, then the branch-collision probe, then the carve, then the
      // fork-point read. The worktree directory name doubles as the branch name.
      expect(proxy.getGitArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', 'probe'],
        ['worktree', 'add', '/repo/worktrees/probe', '-b', 'probe', 'main'],
        ['rev-parse', 'HEAD'],
      ]);
    });
  });

  describe('idempotency', () => {
    // A caller asking twice for the same name wants the same tree, not a second carve and not a
    // refusal. Only the git step is skipped — the mirror, seed and audit run again and each decides
    // for itself what is already satisfied.
    it('VALID: {worktrees/probe already on disk} => returns the same path and spawns NO git at all', async () => {
      const proxy = WorktreeCreateResponderProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });
      proxy.setupFreshCarve({
        repoRoot,
        worktreePath,
        name: 'probe',
        sha: '1234567890abcdef1234567890abcdef12345678',
      });
      proxy.setupWorktreeAlreadyOnDisk({ worktreePath });

      const result = await WorktreeCreateResponder({ name: 'probe' });

      expect(result).toStrictEqual({ worktreePath: '/repo/worktrees/probe' });
      expect(proxy.getGitArgsList()).toStrictEqual([]);
    });
  });

  describe('no base branch to fork from', () => {
    it('ERROR: {neither main nor master resolves} => rejects with BaseBranchNotFoundError before carving anything', async () => {
      const proxy = WorktreeCreateResponderProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      proxy.setupRepoRoot({ repoRoot });
      proxy.setupNoBaseBranch();

      const error = await WorktreeCreateResponder({ name: 'probe' }).catch(
        (thrown: unknown) => thrown,
      );

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'BaseBranchNotFoundError',
        message: 'No local main or master branch found',
      });
      expect(proxy.getGitArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', 'master'],
      ]);
    });
  });

  describe('a worktree whose links leave it', () => {
    // The audit runs LAST and refuses to hand the path back. A caller given a leaking worktree runs
    // commands in it that grade the main checkout and report green.
    it('ERROR: {an absolute node_modules link} => rejects at verify-links rather than returning the path', async () => {
      const proxy = WorktreeCreateResponderProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });
      proxy.setupWorktreeAlreadyOnDisk({ worktreePath });
      proxy.setupRepoRoot({ repoRoot });
      proxy.setupLeakingLink({
        repoRoot,
        worktreePath,
        entryName: '.bin',
        storedTarget: '/repo/node_modules/.bin',
      });

      const error = await WorktreeCreateResponder({ name: 'probe' }).catch(
        (thrown: unknown) => thrown,
      );

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message:
          'Worktree preparation failed at verify-links: /repo/worktrees/probe: 1 of 1 node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: /repo/worktrees/probe/node_modules/.bin -> /repo/node_modules/.bin (lands at /repo/node_modules/.bin)',
      });
    });
  });
});
