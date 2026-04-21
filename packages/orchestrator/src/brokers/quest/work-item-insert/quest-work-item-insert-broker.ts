/**
 * PURPOSE: Insert retry/fix work items into the quest and update downstream deps via replacement mapping
 *
 * USAGE:
 * await questWorkItemInsertBroker({ questId, quest, newWorkItems, replacementMapping });
 * // Modifies workItems in quest with replacement mapping, appends new items, recalculates status, persists
 */

import type {
  AdapterResult,
  DependencyStep,
  Quest,
  QuestId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { ReplacementEntry } from '../../../contracts/replacement-entry/replacement-entry-contract';
import { workItemsToQuestStatusTransformer } from '../../../transformers/work-items-to-quest-status/work-items-to-quest-status-transformer';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questWorkItemInsertBroker = async ({
  questId,
  quest,
  newWorkItems,
  replacementMapping,
  tackOnSteps,
}: {
  questId: QuestId;
  quest: Quest;
  newWorkItems: WorkItem[];
  replacementMapping?: ReplacementEntry[];
  tackOnSteps?: DependencyStep[];
}): Promise<AdapterResult> => {
  const updatedWorkItems = [...quest.workItems];

  if (replacementMapping) {
    for (const { oldId, newId } of replacementMapping) {
      for (const workItem of updatedWorkItems) {
        if (workItem.dependsOn.some((id) => id === oldId)) {
          workItem.dependsOn = workItem.dependsOn.map((id) => (id === oldId ? newId : id));
        }
      }
    }
  }

  updatedWorkItems.push(...newWorkItems);

  const newStatus = workItemsToQuestStatusTransformer({
    workItems: updatedWorkItems,
    currentStatus: quest.status,
  });

  await questModifyBroker({
    input: {
      questId,
      workItems: updatedWorkItems,
      ...(newStatus === quest.status ? {} : { status: newStatus }),
      ...(tackOnSteps ? { steps: [...quest.steps, ...tackOnSteps] } : {}),
    } as ModifyQuestInput,
  });
  return adapterResultContract.parse({ success: true });
};
