/**
 * PURPOSE: Post-completion hook that fires when the `pathseeker` work item transitions to complete — runs the completeness scope of `questValidateSpecTransformer` against the freshly-authored quest (step contract refs resolve, new contracts have creating step, observables satisfied) and, when those pass, invokes `stepsToWorkItemsTransformer` against the quest's authored steps + flows and persists the resulting codeweaver/ward/siegemaster/lawbringer/blightwarden chain onto the quest via questModifyBroker. PathSeeker classifies scope, summons its minions, and runs the architect-review walk itself, then signals complete — this hook is the only point where the authored plan is fully assembled, so the whole-quest completeness check (which can't fire at a status transition under the always-`in_progress` dispatch-loop flow) runs here.
 *
 * USAGE:
 * await questPostWalkHookBroker({ questId, walkWorkItemId, batchGroups });
 * // Re-reads the quest, runs the completeness scope, then (on pass) generates downstream
 * // work items from quest.steps + quest.flows and persists them via questModifyBroker.
 * // Throws when the named work item is not the `pathseeker` planner, when the quest is not
 * // loadable, or when the completeness scope reports failures (details on the error).
 * // Returns AdapterResult on success.
 */

import type {
  AdapterResult,
  FolderTypeGroups,
  ModifyQuestInput,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract, getQuestInputContract } from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { questValidateSpecTransformer } from '../../../transformers/quest-validate-spec/quest-validate-spec-transformer';
import { stepsToWorkItemsTransformer } from '../../../transformers/steps-to-work-items/steps-to-work-items-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questPostWalkHookBroker = async ({
  questId,
  walkWorkItemId,
  batchGroups,
}: {
  questId: QuestId;
  walkWorkItemId: QuestWorkItemId;
  batchGroups: FolderTypeGroups;
}): Promise<AdapterResult> => {
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });
  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = result;
  const pathseekerItem = quest.workItems.find((wi) => wi.id === walkWorkItemId);
  if (!pathseekerItem) {
    throw new Error(`PathSeeker work item not found: ${walkWorkItemId}`);
  }
  if (pathseekerItem.role !== 'pathseeker') {
    throw new Error(`Work item role is not pathseeker: ${pathseekerItem.role}`);
  }

  // Run the completeness scope explicitly — this used to fire at the
  // `seek_walk → in_progress` status hop inside `questSaveInvariantsTransformer`, but
  // under the `/dumpster-launch` flow that hop fires BEFORE pathseeker-walk runs, so the
  // only point at which the plan is fully assembled is here, after pathseeker-walk has
  // signalled complete.
  const completenessChecks = questValidateSpecTransformer({ quest, scope: 'completeness' });
  const completenessFailures = completenessChecks.filter((check) => !check.passed);
  if (completenessFailures.length > 0) {
    const details = completenessFailures
      .map((check) => `${String(check.name)}: ${String(check.details)}`)
      .join('; ');
    throw new Error(`Post-walk completeness validation failed: ${details}`);
  }

  const now = isoTimestampContract.parse(new Date().toISOString());
  const newItems = stepsToWorkItemsTransformer({
    steps: quest.steps,
    flows: quest.flows,
    pathseekerWorkItemId: walkWorkItemId,
    now,
    batchGroups,
  });

  if (newItems.length > 0) {
    await questModifyBroker({
      input: {
        questId,
        workItems: newItems,
      } as ModifyQuestInput,
    });
  }

  return adapterResultContract.parse({ success: true });
};
