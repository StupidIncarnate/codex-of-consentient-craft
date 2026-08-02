/**
 * PURPOSE: Returns the deterministic QA checklist for a quest's flows — every terminal, branch,
 * observable and off-map probe family, plus which of those units still carry no disposition in the
 * quest's QA ledger
 *
 * USAGE:
 * const checklists = await questGetQaChecklistBroker({ questId });
 * // Returns one QaChecklist per flow on the quest
 *
 * const one = await questGetQaChecklistBroker({ questId, flowId });
 * // Returns a single-element array for just that flow
 *
 * WHEN-TO-USE: A Siegemaster session asks this instead of reading the spec and enumerating by hand.
 * It is also what the signal-back completion gate consults, so the agent and the gate are reading
 * the same numbers from the same source rather than one recalling and the other checking.
 *
 * An unknown `flowId` yields an empty array rather than throwing: the caller learns the flow is not
 * on this quest, which is a real answer, and the gate treats "no units" as nothing outstanding.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FlowId, QaChecklist, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { qaChecklistBuildTransformer } from '../../../transformers/qa-checklist-build/qa-checklist-build-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetQaChecklistBroker = async ({
  questId,
  flowId,
}: {
  questId: QuestId;
  flowId?: FlowId;
}): Promise<QaChecklist[]> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const ledger = quest.planningNotes.qaLedger;

  const flows =
    flowId === undefined
      ? quest.flows
      : quest.flows.filter((flow) => String(flow.id) === String(flowId));

  return flows.map((flow) => qaChecklistBuildTransformer({ flow, ledger }));
};
