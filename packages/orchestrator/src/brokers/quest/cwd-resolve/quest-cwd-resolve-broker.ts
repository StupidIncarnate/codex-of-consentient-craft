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
 * const resolution = await questCwdResolveBroker({ questId, sessionId });
 * // resolution.kind === 'session' when the quest recorded a row for that session
 *
 * PASSING A `sessionId` ASKS A DIFFERENT QUESTION — "where did this session ALREADY run", not
 * "where does the next thing run". The two answers diverge on a carved quest: its intake
 * conversation ran at the repo root and every role dispatched after riftcarver ran in the worktree,
 * so one per-quest answer reaches at most one of the two groups. Only the READ paths locating a
 * finished transcript pass it; every spawn site omits it and gets the per-quest answer, unchanged.
 *
 * A recorded row wins over both derived kinds, and is served WITHOUT the worktree accessibility
 * probe — a transcript lives under `~/.claude/projects/`, so it outlives the directory it was
 * written from, and probing would turn a readable transcript into a `missing-worktree` throw.
 */

import {
  filePathContract,
  getQuestInputContract,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import { questSessionCwdTransformer } from '@dungeonmaster/shared/transformers';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { questCwdResolutionContract } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution-contract';
import type { QuestCwdResolution } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution-contract';
import { questGetBroker } from '../get/quest-get-broker';
import { questRepoRootBroker } from '../repo-root/quest-repo-root-broker';

export const questCwdResolveBroker = async ({
  questId,
  sessionId,
}: {
  questId: QuestId;
  // Supplied ONLY by the read paths locating an already-finished transcript. See the header.
  sessionId?: SessionId;
}): Promise<QuestCwdResolution> => {
  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });

  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  // A recorded row settles the question before either derived branch can guess at it.
  if (sessionId !== undefined) {
    const recordedCwd = questSessionCwdTransformer({ quest, sessionId });

    if (recordedCwd !== null) {
      return questCwdResolutionContract.parse({
        kind: 'session',
        cwd: repoRootCwdContract.parse(recordedCwd),
      });
    }
  }

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
