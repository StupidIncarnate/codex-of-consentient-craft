import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  QuestBranchNameStub,
} from '@dungeonmaster/shared/contracts';

import { worktreePrepareBroker } from './worktree-prepare-broker';
import { worktreePrepareBrokerProxy } from './worktree-prepare-broker.proxy';

describe('worktreePrepareBroker', () => {
  describe('happy path', () => {
    it('VALID: {worktree add and rev-parse both succeed} => returns the fork-point sha, spawning exactly those two git calls and never touching discard', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupHappyPath({ worktreePath, branchName, baseBranch, sha });

      const result = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      });

      expect(result).toStrictEqual({ baseRef: sha });
      // The probe comes FIRST and answers "no such branch", which is what selects `-b`. No prune:
      // there is no registration to clear for a branch that does not exist.
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
      ]);
    });
  });

  describe('the branch already exists — a re-carve after the directory was deleted', () => {
    it('VALID: {branch resolves in git} => prunes the stale registration and attaches WITHOUT -b instead of refusing', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = 'fedcba9876543210fedcba9876543210fedcba98';
      proxy.setupAttachExistingBranch({ worktreePath, branchName, sha });

      const result = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      });

      expect(result).toStrictEqual({ baseRef: sha });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'prune'],
        ['worktree', 'add', worktreePath, branchName],
        ['rev-parse', 'HEAD'],
      ]);
    });

    it('ERROR: {attached branch, rev-parse HEAD exits non-zero} => rejects WITHOUT discarding, so the branch keeps the commits this call did not create', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupAttachExistingBranchHeadShaFails({ worktreePath, branchName });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read`,
      });
      // No `worktree remove` and no `branch -D` — the discard would delete the quest's own branch.
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'prune'],
        ['worktree', 'add', worktreePath, branchName],
        ['rev-parse', 'HEAD'],
      ]);
    });
  });

  describe('worktree creation fails', () => {
    it('ERROR: {git worktree add exits non-zero} => rejects at step create naming the worktree path, without attempting discard or reading the fork-point sha', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupWorktreeAddFails({
        worktreePath,
        branchName,
        baseBranch,
        output: "fatal: 'quest/add-auth-7bc217a1' already exists",
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fatal: 'quest/add-auth-7bc217a1' already exists`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
      ]);
    });
  });

  describe('fork-point sha cannot be read', () => {
    it('ERROR: {git rev-parse HEAD exits non-zero} => rejects at step create and discards the worktree', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupHeadShaFailsDiscardSucceeds({ worktreePath, branchName, baseBranch });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
    });
  });

  describe('fork-point sha fails and the discard cleanup also fails', () => {
    it('ERROR: {rev-parse HEAD fails, git worktree remove also exits non-zero} => rejects carrying BOTH the original cause and the cleanup output', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupHeadShaFailsDiscardAlsoFails({
        worktreePath,
        branchName,
        baseBranch,
        removeFailureOutput: 'EBUSY: resource busy',
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read (worktree cleanup also failed: EBUSY: resource busy)`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
      ]);
    });
  });

  // `git worktree add` checks out TRACKED files and `dist` is gitignored, so the tree it makes has
  // no compiled output — and ward's own entry point IS compiled output.
  describe('the compiled output git could not bring across', () => {
    it('VALID: {main checkout built, worktree has no dist yet} => copies the package dist with cp -a', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupHappyPath({ worktreePath, branchName, baseBranch, sha });
      proxy.setupDistSeeded({ repoRoot, worktreePath, packageName: 'ward' });

      const result = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      });

      expect(result).toStrictEqual({ baseRef: sha });
      expect(proxy.getSeedCopyArgs()).toStrictEqual([
        '-a',
        '/repo/packages/ward/dist',
        '/repo/worktrees/add-auth-7bc217a1/packages/ward/dist',
      ]);
    });

    it('ERROR: {main checkout has no dist for a package} => rejects at step seed-dist naming that package', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupHappyPath({ worktreePath, branchName, baseBranch, sha });
      proxy.setupUnbuiltMainCheckout({ repoRoot, worktreePath, packageName: 'ward' });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at seed-dist: ${worktreePath}: the main checkout at ${repoRoot} has no compiled output for 1 package(s) — run the repo's build before carving a worktree: ward`,
      });
      expect(proxy.getSeedCopyArgs()).toBe(undefined);
    });
  });

  describe('a worktree whose links leave it', () => {
    it('ERROR: {a node_modules link stored as an absolute main-checkout path} => rejects at step verify-links', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupHappyPath({ worktreePath, branchName, baseBranch, sha });
      proxy.setupLeakingLink({
        worktreePath,
        entryName: '.bin',
        storedTarget: '/repo/node_modules/.bin',
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at verify-links: ${worktreePath}: 1 of 1 node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: ${worktreePath}/node_modules/.bin -> /repo/node_modules/.bin (lands at /repo/node_modules/.bin)`,
      });
    });
  });
});
