/**
 * PURPOSE: Returns the deterministic QA checklist for a quest's flows — every terminal, branch,
 * observable and off-map probe family, plus which of those units are still outstanding for the
 * calling verification track
 *
 * USAGE:
 * const checklists = await questGetQaChecklistBroker({ questId });
 * // Returns one QaChecklist per flow on the quest
 *
 * const one = await questGetQaChecklistBroker({ questId, flowId });
 * // Returns a single-element array for just that flow
 *
 * const mine = await questGetQaChecklistBroker({ questId, track: 'flowrider' });
 * // Returns the quest's RUNTIME flows, each measured against `flowriderSignoff`
 *
 * WHEN-TO-USE: A Flowrider or Siegemaster session asks this instead of reading the spec and
 * enumerating by hand. `track` makes the answer the same one the signal-back completion gate will
 * compute, so the agent and the gate read the same numbers from the same source rather than one
 * recalling and the other checking.
 *
 * `track` NARROWS THE FLOW SET THE SAME WAY THE GATE DOES, which is what keeps the reconcile loop
 * satisfiable. Flowrider is measured over the quest's `flowType: 'runtime'` flows only, so handing
 * it every flow would print operational units it can never be refused on — and, worse, hide the
 * runtime ones in the noise. Siegemaster is measured over whatever flows its item declares, of
 * either type, so it gets the unfiltered list. An explicit `flowId` always wins over the track
 * filter: naming a flow is an explicit request for that flow.
 *
 * An unknown `flowId` yields an empty array rather than throwing: the caller learns the flow is not
 * on this quest, which is a real answer, and the gate treats "no units" as nothing outstanding.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FlowId, QaChecklist, QuestId, SignoffTrack } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { qaChecklistBuildTransformer } from '../../../transformers/qa-checklist-build/qa-checklist-build-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetQaChecklistBroker = async ({
  questId,
  flowId,
  track,
}: {
  questId: QuestId;
  flowId?: FlowId;
  track?: SignoffTrack;
}): Promise<QaChecklist[]> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const ledger = quest.planningNotes.qaLedger;

  const trackScopedFlows =
    track === 'flowrider' ? quest.flows.filter((flow) => flow.flowType === 'runtime') : quest.flows;

  const flows =
    flowId === undefined
      ? trackScopedFlows
      : quest.flows.filter((flow) => String(flow.id) === String(flowId));

  return flows.map((flow) =>
    qaChecklistBuildTransformer({ flow, ledger, ...(track !== undefined && { track }) }),
  );
};
