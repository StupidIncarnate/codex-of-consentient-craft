import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  QuestBranchNameStub,
} from '@dungeonmaster/shared/contracts';

import { worktreePrepareBroker } from './worktree-prepare-broker';
import { worktreePrepareBrokerProxy } from './worktree-prepare-broker.proxy';

describe('worktreePrepareBroker', () => {
  describe('happy path', () => {
    it('VALID: {every step succeeds} => returns the fork-point sha, builds in the worktree, and never touches discard', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const buildCommand = 'npm run build';
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupHappyPath({ worktreePath, branchName, baseBranch, buildCommand, sha });

      const result = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
        buildCommand,
      });

      expect(result).toStrictEqual({ baseRef: sha });
      expect(proxy.getBuildSpawnedCwd({ command: 'npm' })).toBe(worktreePath);
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
      ]);
    });
  });

  describe('worktree creation fails', () => {
    it('ERROR: {git worktree add exits non-zero} => rejects at step create naming the worktree path, without attempting discard or running populate/build', async () => {
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
        buildCommand: 'npm run build',
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fatal: 'quest/add-auth-7bc217a1' already exists`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
      ]);
      expect(proxy.getBuildSpawnedArgs({ command: 'npm' })).toBe(undefined);
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
        buildCommand: 'npm run build',
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
    });
  });

  describe('node_modules population rejects', () => {
    it('ERROR: {worktreePopulateNodeModulesBroker rejects} => rejects at step node_modules carrying the caught error message, discards the worktree, and never runs the build', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupPopulateRejectsDiscardSucceeds({
        worktreePath,
        branchName,
        baseBranch,
        sha,
        error: new Error('EACCES: permission denied'),
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
        buildCommand: 'npm run build',
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at node_modules: ${worktreePath}: EACCES: permission denied`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
      expect(proxy.getBuildSpawnedArgs({ command: 'npm' })).toBe(undefined);
    });
  });

  describe('build fails', () => {
    it('ERROR: {buildPreflightBroker returns success: false} => rejects at step build carrying the build output and discards the worktree', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const buildCommand = 'npm run build';
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupBuildFailsDiscardSucceeds({
        worktreePath,
        branchName,
        baseBranch,
        buildCommand,
        sha,
        buildOutput: 'tsc exited with code 2',
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
        buildCommand,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at build: ${worktreePath}: tsc exited with code 2`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
    });
  });

  describe('build fails and the discard cleanup also fails', () => {
    it('ERROR: {build fails, git worktree remove also exits non-zero} => rejects at step build carrying BOTH the build cause and the cleanup output', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const buildCommand = 'npm run build';
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupBuildFailsDiscardAlsoFails({
        worktreePath,
        branchName,
        baseBranch,
        buildCommand,
        sha,
        buildOutput: 'tsc exited with code 2',
        removeFailureOutput: 'EBUSY: resource busy',
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
        buildCommand,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at build: ${worktreePath}: tsc exited with code 2 (worktree cleanup also failed: EBUSY: resource busy)`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
      ]);
    });
  });
});
