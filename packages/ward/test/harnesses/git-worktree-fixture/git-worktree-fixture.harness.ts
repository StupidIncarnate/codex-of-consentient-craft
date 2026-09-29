/**
 * PURPOSE: Builds a real throwaway git repo — optionally with a real bare remote and a real
 * `git worktree add` checkout — so the two diff brokers can be proven against real git instead of a
 * mocked spawn. gitDiffCommittedBroker's worktree-vs-repo-root isolation and gitDiffUncommittedBroker's
 * tracked-vs-untracked union are both invisible to a mocked spawn, which cannot distinguish one cwd,
 * one ref, or one kind of file from another. `packages/orchestrator` owns a much larger fixture with the same name
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
import { gitRun } from '#gateway/bin/git';
import { ensureDirSync, writeFileSync } from '#gateway/node/fs';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitBranchName } from '../../../src/contracts/git-branch-name/git-branch-name-contract';
import type { GitRelativePath } from '../../../src/contracts/git-relative-path/git-relative-path-contract';

// Real committer identity + disabled GPG signing, passed as `-c` config so these throwaway fixture
// commits never depend on, or mutate, the developer's real global git config. `user.*` sets both
// the author and the committer.
const GIT_COMMIT_CONFIG = {
  'user.name': 'Dungeonmaster Ward Fixture',
  'user.email': 'ward-fixture@dungeonmaster.test',
  'commit.gpgsign': 'false',
};

const GIT_COMMIT_CONFIG_ARGS = Object.entries(GIT_COMMIT_CONFIG).flatMap(([key, value]) => [
  '-c',
  `${key}=${value}`,
]);

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
  }) => Promise<void>;
} => {
  const runGit = async ({
    cwd,
    args,
  }: {
    cwd: AbsoluteFilePath;
    args: readonly string[];
  }): Promise<void> => {
    // A real fixture repo: git is expected on the machine running these integration tests, so a
    // missing binary (GitNotInstalledError) is left to throw. A non-zero exit throws too, so a
    // fixture step that failed cannot pass silently into the assertions built on it.
    const { exitCode, output } = await gitRun({
      args: [...GIT_COMMIT_CONFIG_ARGS, ...args],
      cwd,
    });
    if (exitCode !== 0) {
      throw new Error(`git ${args.join(' ')} failed with exit code ${String(exitCode)}: ${output}`);
    }
  };

  return {
    initRepo: async ({ repoPath }: { repoPath: AbsoluteFilePath }): Promise<void> => {
      ensureDirSync(repoPath);
      await runGit({ cwd: repoPath, args: ['init', '-b', 'main'] });
      writeFileSync(join(repoPath, 'base.txt'), 'base\n');
      await runGit({ cwd: repoPath, args: ['add', '-A'] });
      await runGit({ cwd: repoPath, args: ['commit', '-m', 'base'] });
    },

    initBareRemote: async ({ remotePath }: { remotePath: AbsoluteFilePath }): Promise<void> => {
      ensureDirSync(remotePath);
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

    // `-u` creates the remote-tracking ref, which is what makes `origin/main` resolvable for
    // gitDetectOriginDefaultBranchBroker. A branch never pushed has no such ref for git to verify.
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
      ensureDirSync(dirname(targetPath));
      writeFileSync(targetPath, content);
      await runGit({ cwd, args: ['add', '-A'] });
      await runGit({ cwd, args: ['commit', '-m', `commit ${relativePath}`] });
    },

    writeUncommittedFile: async ({
      cwd,
      relativePath,
      content,
    }: {
      cwd: AbsoluteFilePath;
      relativePath: GitRelativePath;
      content: string;
    }): Promise<void> => {
      const targetPath = join(cwd, relativePath);
      await ensureDir(dirname(targetPath));
      await writeFile(targetPath, content);
    },
  };
};
