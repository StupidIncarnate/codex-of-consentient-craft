/**
 * PURPOSE: Sweeps every pending work item with no smoketestPromptOverride on a quest, dispenses the next canned prompt per role, and stamps the override atomically
 *
 * USAGE:
 * await smoketestSweepPendingWorkItemsLayerBroker({ questId, abortSignal, dispense });
 * // Reads the quest, iterates pending + unstamped work items, calls dispense per role, and stamps via smoketestStampOverrideBroker.
 * // Returns early when the abortSignal is already aborted.
 *
 * WHEN-TO-USE: Invoked by the scenario driver's event handler AND by the initial sweep that runs once after subscribe
 * so work items hydrated before subscription also get stamped. Keep both call sites pointing at this single routine
 * to guarantee identical behavior.
 * WHEN-NOT-TO-USE: Outside the smoketest scenario driver.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, WorkItemRole } from '@dungeonmaster/shared/contracts';
import { isPendingWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import {
  smoketestPromptsStatics,
  type SmoketestPromptName,
} from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { smoketestStampOverrideBroker } from '../stamp-override/smoketest-stamp-override-broker';

type Dispense = ({ role }: { role: WorkItemRole }) => SmoketestPromptName | null;

export const smoketestSweepPendingWorkItemsLayerBroker = async ({
  questId,
  abortSignal,
  dispense,
}: {
  questId: QuestId;
  abortSignal: AbortSignal;
  dispense: Dispense;
}): Promise<{ success: true }> => {
  if (abortSignal.aborted) {
    return { success: true as const };
  }

  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const quest = await questLoadBroker({ questFilePath });

  const targets = quest.workItems.filter(
    (item) =>
      isPendingWorkItemStatusGuard({ status: item.status }) &&
      item.smoketestPromptOverride === undefined,
  );

  await Promise.all(
    targets.map(async (item) => {
      const promptName = dispense({ role: item.role });
      if (promptName === null) {
        return;
      }
      const override = promptTextContract.parse(smoketestPromptsStatics[promptName]);
      await smoketestStampOverrideBroker({
        questId,
        workItemId: item.id,
        override,
      });
    }),
  );

  return { success: true as const };
};
