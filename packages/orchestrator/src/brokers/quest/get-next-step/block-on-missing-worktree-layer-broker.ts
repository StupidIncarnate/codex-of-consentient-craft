/**
 * PURPOSE: Layer helper for questGetNextStepBroker — halts a quest whose recorded worktree
 *   directory has been deleted out from under it. There is no legitimate fallback here (unlike
 *   a legacy pre-worktree quest, which is meant to run from the repo root): a worktree the quest
 *   itself created and then lost is an operator error the dispatcher cannot route around, so the
 *   only safe move is to stop and name the path — continuing would silently dispatch this
 *   quest's agents against the repo root checkout, which is a DIFFERENT branch's source. The
 *   reason string carries the absolute path because `blocked` alone gives the user nothing to
 *   act on.
 *
 * USAGE:
 * const { blocked } = await blockOnMissingWorktreeLayerBroker({ quest, worktreePath });
 * // Blocks the quest — via questBlockOnFailureBroker when a work item exists to carry the
 * //   reason, or a direct questModifyBroker status write when the quest has none yet. `blocked`
 * //   reports whether the write actually landed.
 */

import type { AbsoluteFilePath, ModifyQuestInput, Quest } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const blockOnMissingWorktreeLayerBroker = async ({
  quest,
  worktreePath,
}: {
  quest: Quest;
  worktreePath: AbsoluteFilePath;
}): Promise<{ blocked: boolean }> => {
  const reason = errorMessageContract.parse(`Worktree not found: ${worktreePath}`);

  // The failure reason lands on the first still-actionable item so the execution view surfaces
  // it against work the user is actually waiting on; once every item is terminal, the last one
  // is the closest thing to "what this quest was doing" left to carry it.
  const carrier =
    quest.workItems.find((item) => !isTerminalWorkItemStatusGuard({ status: item.status })) ??
    quest.workItems[quest.workItems.length - 1];

  if (carrier === undefined) {
    // No work item has been minted yet (a pending ledger scope with nothing dispatchable) —
    // there is nothing to fail, so the status write itself is the only way to stop the scan
    // from spinning against the missing tree forever.
    const result = await questModifyBroker({
      input: { questId: quest.id, status: 'blocked' } as ModifyQuestInput,
    });
    return { blocked: result.success };
  }

  return questBlockOnFailureBroker({
    questId: quest.id,
    failedWorkItemId: carrier.id,
    reason,
  });
};
