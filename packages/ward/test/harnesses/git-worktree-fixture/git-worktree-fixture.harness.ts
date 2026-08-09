/**
 * PURPOSE: Builds a real throwaway git repo plus a real `git worktree add` checkout so
 * gitDiffFilesBroker's worktree-vs-repo-root isolation can be proven against real git instead of a
 * mocked spawn. `packages/orchestrator` owns a much larger fixture with the same name
 * (git-worktree-fixture.harness.ts under its own test/harnesses/) but ward has no dependency on the
 * orchestrator package — its package.json lists only @dungeonmaster/shared and @dungeonmaster/testing
 * — so that harness is not importable here (no project reference, no package.json export, and no
 * existing cross-package test-harness import anywhere in the repo). This harness intentionally stays
 * small: init + worktree + commit is all `git-diff-files-broker.integration.test.ts` needs, not the
 * orchestrator harness's branch drift, symlinked workspace packages, or build-script scaffolding.
 *
 * USAGE:
 * const git = wardGitWorktreeFixtureHarness();
 * await git.initRepo({ repoPath });
 * await git.addWorktree({ repoPath, worktreePath, branchName: GitBranchNameStub({ value: 'quest/x' }) });
 * await git.commitFile({ cwd: worktreePath, relativePath: GitRelativePathStub({ value: 'a.txt' }), content: 'hi\n' });
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
  };
};
