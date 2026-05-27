/**
 * PURPOSE: Post-completion hook that fires when a `pathseeker-walk` work item transitions to complete — runs the completeness scope of `questValidateSpecTransformer` against the freshly-authored quest (step contract refs resolve, new contracts have creating step, observables satisfied) and, when those pass, invokes `stepsToWorkItemsTransformer` against the quest's authored steps + flows and persists the resulting codeweaver/ward/siegemaster/lawbringer/blightwarden chain onto the quest via questModifyBroker. Replaces the legacy `run-pathseeker-layer-broker` post-success inline path now that pathseeker is decomposed into the four-tier graph. The completeness scope used to be triggered by `questSaveInvariantsTransformer` at the `seek_walk → in_progress` status hop; under the `/dumpster-launch` flow that hop happens BEFORE pathseeker-walk runs, so the check is invoked here instead — the only point where the authored plan is fully assembled.
 *
 * USAGE:
 * await questPostWalkHookBroker({ questId, walkWorkItemId, batchGroups });
 * // Re-reads the quest, runs the completeness scope, then (on pass) generates downstream
 * // work items from quest.steps + quest.flows and persists them via questModifyBroker.
 * // Throws when the named work item is not pathseeker-walk, when the quest is not loadable,
 * // or when the completeness scope reports failures (with the failure details on the error).
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
  const walkItem = quest.workItems.find((wi) => wi.id === walkWorkItemId);
  if (!walkItem) {
    throw new Error(`Walk work item not found: ${walkWorkItemId}`);
  }
  if (walkItem.role !== 'pathseeker-walk') {
    throw new Error(`Work item role is not pathseeker-walk: ${walkItem.role}`);
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
