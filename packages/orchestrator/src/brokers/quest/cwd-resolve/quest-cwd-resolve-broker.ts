/**
 * PURPOSE: The single place every quest-scoped spawn (agent, ward run, chat session) asks "what
 * cwd does this quest run in" — reading the quest's own recorded worktree state instead of a
 * guild-path-derived fallback re-computed at each call site. Reach for questRepoRootBroker
 * directly only for the legacy repo-root-from-guild-path resolution this broker itself falls
 * back to when the quest predates worktrees.
 *
 * USAGE:
 * const resolution = await questCwdResolveBroker({ questId });
 * // resolution.kind === 'worktree' | 'repo-root' | 'missing-worktree'
 */

import {
  filePathContract,
  getQuestInputContract,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { questCwdResolutionContract } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution-contract';
import type { QuestCwdResolution } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution-contract';
import { questGetBroker } from '../get/quest-get-broker';
import { questRepoRootBroker } from '../repo-root/quest-repo-root-broker';

export const questCwdResolveBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestCwdResolution> => {
  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });

  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  if (quest.worktreePath === undefined) {
    return questCwdResolutionContract.parse({
      kind: 'repo-root',
      cwd: await questRepoRootBroker({ questId }),
    });
  }

  const isAccessible = await fsIsAccessibleAdapter({
    filePath: filePathContract.parse(quest.worktreePath),
  });

  if (isAccessible) {
    return questCwdResolutionContract.parse({
      kind: 'worktree',
      cwd: repoRootCwdContract.parse(quest.worktreePath),
    });
  }

  return questCwdResolutionContract.parse({
    kind: 'missing-worktree',
    worktreePath: quest.worktreePath,
  });
};
