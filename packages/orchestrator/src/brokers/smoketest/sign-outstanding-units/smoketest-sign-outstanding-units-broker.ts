/**
 * PURPOSE: Settles, as the harness rather than as an agent, whatever the signal-back completion gate
 * would refuse a scripted smoketest work item for — so a canned one-line prompt that walks nothing
 * can still reach `done` and let the relay drain to a terminal quest.
 *
 * USAGE:
 * await smoketestSignOutstandingUnitsBroker({ questId, workItemId });
 * // No-ops unless the work item's linked operation item belongs to a gated track with units left
 *
 * WHEN-TO-USE: The smoketest scenario driver, immediately before it stamps a canned prompt override
 * on a pending work item. Production orchestration must never call this — a real session's sign-off
 * is its evidence, and this one carries `smoketestStatics.signoffEvidence`, which says outright that
 * nothing was verified.
 * WHEN-NOT-TO-USE: Anywhere outside the smoketest flow.
 *
 * THE GATE IS NOT WEAKENED, AND MUST NOT BE. It still runs on every scripted `done`, recomputes the
 * outstanding set from the graph, and allows only because there is nothing left — which is the same
 * bar a real session clears. A smoketest branch inside
 * `quest-handle-signal-back-responder` would instead leave the one surface the suite exists to cover
 * untested on every run.
 *
 * WHICH ROLES ARE GATED IS DATA, read out of `signoffTrackEligibilityStatics.byTrack` rather than
 * matched against role names. Today only siegemaster bites, because it is the one track whose
 * `flowTypes` includes `operational` and the minimal blueprint's flow is operational; the day a
 * blueprint gains a runtime flow, flowrider and groundstomper start biting too and this covers them
 * without an edit. The same entry supplies the FIELD to write, which is a many-to-one map — flowrider
 * and groundstomper both write `flowriderSignoff` — so it can never be guessed off the role name.
 *
 * The outstanding list comes from `signoffOutstandingTransformer`, the very function the gate calls.
 * A second derivation here could disagree with it, and a harness that signs a different set than the
 * gate measures reproduces the blockage it exists to remove.
 *
 * Bypasses `questModifyBroker` for the reason `questResetFlowSignoffsBroker` does: this is a
 * read-modify-write over whole flows rather than an upsert of a caller-supplied patch. It takes the
 * public `questWithModifyLockBroker` itself and persists through `questPersistBroker`.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  signoffContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { smoketestStatics } from '../../../statics/smoketest/smoketest-statics';
import { signoffOutstandingTransformer } from '../../../transformers/signoff-outstanding/signoff-outstanding-transformer';
import { smoketestFlowSignoffApplyTransformer } from '../../../transformers/smoketest-flow-signoff-apply/smoketest-flow-signoff-apply-transformer';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { questPersistBroker } from '../../quest/persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../../quest/with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;
const OPERATIONS_REF_PREFIX = 'operations/';

export const smoketestSignOutstandingUnitsBroker = async ({
  questId,
  workItemId,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
}): Promise<{ success: true }> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ success: true }> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );

      const loadedQuest = await questLoadBroker({ questFilePath });

      // Every miss below is a NO-OP rather than a throw: this runs inside the driver's sweep over
      // every pending work item, and a work item that has no gate to satisfy is the ordinary case,
      // not a fault. Throwing would fail the whole sweep — and with it the scenario — on it.
      const workItem = loadedQuest.workItems.find((item) => item.id === workItemId);
      if (workItem === undefined) {
        return { success: true as const };
      }

      const linkedRef = workItem.relatedDataItems
        .map((ref) => String(ref))
        .find((ref) => ref.startsWith(OPERATIONS_REF_PREFIX));
      const operationItem = loadedQuest.operations.find(
        (item) => String(item.id) === linkedRef?.split('/')[1],
      );
      if (operationItem === undefined) {
        return { success: true as const };
      }

      // A `Map` over the statics' own entries rather than an `in` check plus an index: the lookup
      // answers "is this role a track" and "which field does that track write" in one read, off the
      // one object that defines both.
      const eligibility = new Map(Object.entries(signoffTrackEligibilityStatics.byTrack)).get(
        operationItem.role,
      );
      if (eligibility === undefined) {
        return { success: true as const };
      }

      const outstanding = signoffOutstandingTransformer({ quest: loadedQuest, operationItem });
      if (outstanding.length === 0) {
        return { success: true as const };
      }

      // `confirmed`, never `unconfirmable`: the second verdict clears the gate too, but it REQUIRES a
      // `question`, and littering a happy-path fixture with fake open questions would make every
      // smoketest quest read as though a real session had hit walls it could not get past.
      const signoff = signoffContract.parse({
        verdict: 'confirmed',
        evidence: smoketestStatics.signoffEvidence,
        workItemId,
        at: new Date().toISOString(),
      });

      const updatedQuest = questContract.parse({
        ...loadedQuest,
        flows: loadedQuest.flows.map((flow) =>
          smoketestFlowSignoffApplyTransformer({
            flow,
            unitIds: outstanding,
            signoffField: eligibility.signoffField,
            signoff,
          }),
        ),
        updatedAt: new Date().toISOString(),
      });

      const questJson = fileContentsContract.parse(
        JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
      );

      await questPersistBroker({ questFilePath, contents: questJson, questId });

      return { success: true as const };
    },
  });
