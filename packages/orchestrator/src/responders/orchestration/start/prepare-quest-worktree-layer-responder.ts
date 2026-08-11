/**
 * PURPOSE: Runs the git side of Quest Start — base-branch detection, the branch/worktree
 * name-collision check, and worktree creation — entirely before anything is persisted to
 * quest.json, so every throw here (BaseBranchNotFoundError, QuestBranchNameTakenError, or a
 * propagated WorktreePrepareError) leaves the quest in the startable status it arrived in and
 * Start can simply be retried. Skips the whole lifecycle, spawning nothing, once the quest
 * already records both a branch and a worktree: Start is crash-safe by re-running, and without
 * this skip a re-Start would find its OWN branch and refuse itself with the name-taken error,
 * permanently locking the quest out of starting.
 *
 * USAGE:
 * const gitContext = await PrepareQuestWorktreeLayerResponder({ quest });
 * // undefined when the quest already carries a recorded branch + worktree (skip); otherwise
 * // the { branchName, baseBranch, worktreePath, baseRef } to stamp onto the quest
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsWorktreePathFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { configDefaultsStatics } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { gitVerifyRefAdapter } from '../../../adapters/git/verify-ref/git-verify-ref-adapter';
import { gitDetectBaseBranchBroker } from '../../../brokers/git/detect-base-branch/git-detect-base-branch-broker';
import { questRepoRootBroker } from '../../../brokers/quest/repo-root/quest-repo-root-broker';
import { worktreePrepareBroker } from '../../../brokers/worktree/prepare/worktree-prepare-broker';
import { BaseBranchNotFoundError } from '../../../errors/base-branch-not-found/base-branch-not-found-error';
import { QuestBranchNameTakenError } from '../../../errors/quest-branch-name-taken/quest-branch-name-taken-error';
import { questToGitNamesTransformer } from '../../../transformers/quest-to-git-names/quest-to-git-names-transformer';

// Wrapped in Readonly<> (rather than a bare object literal) so consistent-type-definitions does
// not autofix this into an interface, which ban-adhoc-types then bans in responders/ files.
export type QuestGitContextWrite = Readonly<{
  branchName: NonNullable<Quest['branchName']>;
  baseBranch: NonNullable<Quest['baseBranch']>;
  worktreePath: NonNullable<Quest['worktreePath']>;
  baseRef: NonNullable<Quest['baseRef']>;
}>;

export const PrepareQuestWorktreeLayerResponder = async ({
  quest,
}: {
  quest: Quest;
}): Promise<QuestGitContextWrite | undefined> => {
  if (quest.branchName !== undefined && quest.worktreePath !== undefined) {
    return undefined;
  }

  const repoRoot = await questRepoRootBroker({ questId: quest.id });
  const baseBranch = await gitDetectBaseBranchBroker({ cwd: repoRoot });

  if (baseBranch === null) {
    throw new BaseBranchNotFoundError();
  }

  const { branchName, worktreeDirName } = questToGitNamesTransformer({
    title: quest.title,
    questId: quest.id,
  });
  const worktreePath = locationsWorktreePathFindBroker({ repoRoot, worktreeDirName });

  const [branchTaken, worktreeTaken] = await Promise.all([
    gitVerifyRefAdapter({ cwd: repoRoot, ref: branchName }),
    fsIsAccessibleAdapter({ filePath: filePathContract.parse(worktreePath) }),
  ]);

  if (branchTaken || worktreeTaken) {
    throw new QuestBranchNameTakenError({ branchName });
  }

  // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so
  // hand it the repo-root config file itself (<repoRoot>/.dungeonmaster.json), NOT the bare
  // repoRoot directory: a bare directory dirname()s to repoRoot's PARENT, walks above the repo
  // root, and misses the config (see agent-prompt-get-broker.ts for the same shape).
  const startPath = filePathContract.parse(
    pathJoinAdapter({ paths: [repoRoot, dungeonmasterHomeStatics.paths.projectConfigFile] }),
  );

  // Absence of a config file (ConfigNotFoundError) is a legitimate "no override" state — fall
  // back to the same default the config contract itself applies. Any other error (malformed
  // JSON, validation, permissions) MUST surface.
  const config = await (async () => {
    try {
      return await dungeonmasterConfigResolveAdapter({ startPath });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConfigNotFoundError') {
        return null;
      }
      throw error;
    }
  })();
  const buildCommand =
    config?.devServer?.buildCommand ?? configDefaultsStatics.devServer.buildCommand;

  const { baseRef } = await worktreePrepareBroker({
    repoRoot,
    worktreePath,
    branchName,
    baseBranch,
    buildCommand,
  });

  return { branchName, baseBranch, worktreePath, baseRef };
};
