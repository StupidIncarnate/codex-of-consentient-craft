/**
 * PURPOSE: Builds a real throwaway git repo — optionally with a real bare remote and a real
 * `git worktree add` checkout — so the two diff brokers can be proven against real git instead of a
 * mocked spawn. gitDiffFilesBroker's worktree-vs-repo-root isolation and gitDiffUnpushedBroker's
 * pushed-vs-unpushed split are both invisible to a mocked spawn, which cannot distinguish one cwd or
 * one ref from another. `packages/orchestrator` owns a much larger fixture with the same name
 * (git-worktree-fixture.harness.ts under its own test/harnesses/) but ward has no dependency on the
 * orchestrator package — its package.json lists only @dungeonmaster/shared and @dungeonmaster/testing
 * — so that harness is not importable here (no project reference, no package.json export, and no
 * existing cross-package test-harness import anywhere in the repo). This harness intentionally stays
 * small: init + remote + worktree + commit is all the two integration tests need, not the
 * orchestrator harness's symlinked workspace packages or build-script scaffolding.
 *
 * USAGE:
 * const git = wardGitWorktreeFixtureHarness();
 * await git.initRepo({ repoPath });
 * await git.initBareRemote({ remotePath });
 * await git.addRemote({ cwd: repoPath, remotePath });
 * await git.pushBranch({ cwd: repoPath, branchName: GitBranchNameStub({ value: 'main' }) });
 * await git.commitFile({ cwd: repoPath, relativePath: GitRelativePathStub({ value: 'a.txt' }), content: 'hi\n' });
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitBranchName } from '../../../src/contracts/git-branch-name/git-branch-name-contract';
import type { GitRelativePath } from '../../../src/contracts/git-relative-path/git-relative-path-contract';

// Real committer identity + disabled GPG signing, scoped to the child process env so these
// throwaway fixture commits never depend on, or mutate, the developer's real global git config —
// mirrors the orchestrator fixture's own GIT_COMMIT_ENV rather than importing it (see PURPOSE).
const GIT_COMMIT_ENV = {
  GIT_AUTHOR_NAME: 'Dungeonmaster Ward Fixture',
  GIT_AUTHOR_EMAIL: 'ward-fixture@dungeonmaster.test',
  GIT_COMMITTER_NAME: 'Dungeonmaster Ward Fixture',
  GIT_COMMITTER_EMAIL: 'ward-fixture@dungeonmaster.test',
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'commit.gpgsign',
  GIT_CONFIG_VALUE_0: 'false',
};

export const wardGitWorktreeFixtureHarness = (): {
  initRepo: (params: { repoPath: AbsoluteFilePath }) => Promise<void>;
  initBareRemote: (params: { remotePath: AbsoluteFilePath }) => Promise<void>;
  addRemote: (params: { cwd: AbsoluteFilePath; remotePath: AbsoluteFilePath }) => Promise<void>;
  pushBranch: (params: { cwd: AbsoluteFilePath; branchName: GitBranchName }) => Promise<void>;
  checkoutNewBranch: (params: {
    cwd: AbsoluteFilePath;
    branchName: GitBranchName;
  }) => Promise<void>;
  addWorktree: (params: {
    repoPath: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    branchName: GitBranchName;
  }) => Promise<void>;
  commitFile: (params: {
    cwd: AbsoluteFilePath;
    relativePath: GitRelativePath;
    content: string;
  }) => Promise<void>;
  writeUncommittedFile: (params: {
    cwd: AbsoluteFilePath;
    relativePath: GitRelativePath;
    content: string;
  }) => void;
} => {
  const runGit = async ({
    cwd,
    args,
  }: {
    cwd: AbsoluteFilePath;
    args: readonly string[];
  }): Promise<void> => {
    await childProcessSpawnCaptureAdapter({
      command: 'git',
      args: [...args],
      cwd,
      env: GIT_COMMIT_ENV,
    });
  };

  return {
    initRepo: async ({ repoPath }: { repoPath: AbsoluteFilePath }): Promise<void> => {
      mkdirSync(repoPath, { recursive: true });
      await runGit({ cwd: repoPath, args: ['init', '-b', 'main'] });
      writeFileSync(join(repoPath, 'base.txt'), 'base\n');
      await runGit({ cwd: repoPath, args: ['add', '-A'] });
      await runGit({ cwd: repoPath, args: ['commit', '-m', 'base'] });
    },

    initBareRemote: async ({ remotePath }: { remotePath: AbsoluteFilePath }): Promise<void> => {
      mkdirSync(remotePath, { recursive: true });
      await runGit({ cwd: remotePath, args: ['init', '--bare', '-b', 'main'] });
    },

    addRemote: async ({
      cwd,
      remotePath,
    }: {
      cwd: AbsoluteFilePath;
      remotePath: AbsoluteFilePath;
    }): Promise<void> => {
      await runGit({ cwd, args: ['remote', 'add', 'origin', remotePath] });
    },

    // `-u` is what makes @{upstream} resolve afterwards, which is the ref gitDetectUpstreamBroker
    // asks for first. A branch pushed without it stays untracked and exercises the fallback instead.
    pushBranch: async ({
      cwd,
      branchName,
    }: {
      cwd: AbsoluteFilePath;
      branchName: GitBranchName;
    }): Promise<void> => {
      await runGit({ cwd, args: ['push', '-u', 'origin', branchName] });
    },

    checkoutNewBranch: async ({
      cwd,
      branchName,
    }: {
      cwd: AbsoluteFilePath;
      branchName: GitBranchName;
    }): Promise<void> => {
      await runGit({ cwd, args: ['checkout', '-b', branchName] });
    },

    addWorktree: async ({
      repoPath,
      worktreePath,
      branchName,
    }: {
      repoPath: AbsoluteFilePath;
      worktreePath: AbsoluteFilePath;
      branchName: GitBranchName;
    }): Promise<void> => {
      await runGit({ cwd: repoPath, args: ['worktree', 'add', worktreePath, '-b', branchName] });
    },

    commitFile: async ({
      cwd,
      relativePath,
      content,
    }: {
      cwd: AbsoluteFilePath;
      relativePath: GitRelativePath;
      content: string;
    }): Promise<void> => {
      const targetPath = join(cwd, relativePath);
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, content);
      await runGit({ cwd, args: ['add', '-A'] });
      await runGit({ cwd, args: ['commit', '-m', `commit ${relativePath}`] });
    },

    writeUncommittedFile: ({
      cwd,
      relativePath,
      content,
    }: {
      cwd: AbsoluteFilePath;
      relativePath: GitRelativePath;
      content: string;
    }): void => {
      const targetPath = join(cwd, relativePath);
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, content);
    },
  };
};
