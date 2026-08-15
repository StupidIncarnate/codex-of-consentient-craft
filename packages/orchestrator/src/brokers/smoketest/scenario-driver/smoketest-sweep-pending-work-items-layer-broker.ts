/**
 * PURPOSE: Sweeps every pending work item with no smoketestPromptOverride on a quest, dispenses the next canned prompt per role, settles whatever the completion gate would refuse that role, and stamps the override atomically
 *
 * USAGE:
 * await smoketestSweepPendingWorkItemsLayerBroker({ questId, abortSignal, dispense });
 * // Reads the quest, iterates pending + unstamped work items, calls dispense per role, signs the item's
 * // outstanding verification units via smoketestSignOutstandingUnitsBroker, and stamps via smoketestStampOverrideBroker.
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
import { smoketestPlaceholdersStatics } from '../../../statics/smoketest-placeholders/smoketest-placeholders-statics';
import {
  smoketestPromptsStatics,
  type SmoketestPromptName,
} from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { smoketestSignOutstandingUnitsBroker } from '../sign-outstanding-units/smoketest-sign-outstanding-units-broker';
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
      // The ids are resolved HERE rather than at authoring time because an orchestration work item
      // is minted mid-relay: its id does not exist when the scenario's script is written, and the
      // scripted agent has no other way to learn it — `signal-back` requires both ids and a one-line
      // prompt is that agent's entire context. Left unresolved, every scripted session is refused by
      // the tool, never signals, and the quest blocks once orphan recovery spends its resets.
      const override = promptTextContract.parse(
        smoketestPromptsStatics[promptName]
          .split(smoketestPlaceholdersStatics.questId)
          .join(String(questId))
          .split(smoketestPlaceholdersStatics.workItemId)
          .join(String(item.id)),
      );
      // The scripted session this override is about to drive walks nothing and writes no sign-off,
      // so a role carrying the server-side completion gate would have `done` refused every time,
      // never signal, and leave the quest to orphan recovery — which is what stops any smoketest
      // reaching `complete` and leaves the whole terminal path uncovered. The harness settles that
      // scope itself, BEFORE the stamp, so the sign-offs are on disk by the time the agent signals.
      // The gate is untouched: it still runs, still recomputes, and allows only because the
      // denominator is empty.
      await smoketestSignOutstandingUnitsBroker({ questId, workItemId: item.id });
      await smoketestStampOverrideBroker({
        questId,
        workItemId: item.id,
        override,
      });
    }),
  );

  return { success: true as const };
};
