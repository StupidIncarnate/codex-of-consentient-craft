/**
 * PURPOSE: Writes a fabricated, honestly-labeled sign-off onto every verification unit a scripted
 * smoketest work item's track still has open — so the quest.json a scenario leaves behind on disk
 * reads as fully covered instead of permanently unsigned. Nothing gates a `done` on sign-off
 * completeness any more, so this is not a workaround for a refusal: a canned prompt reaches `done`
 * either way. It exists for the durable file itself — a human (or the quest summary) opening a
 * smoketest quest later sees explicit, confessed fixture evidence rather than blank tracks that
 * could be mistaken for real, unexplained coverage gaps.
 *
 * USAGE:
 * await smoketestSignOutstandingUnitsBroker({ questId, workItemId });
 * // No-ops unless the work item's linked operation item belongs to a track with units left
 *
 * WHEN-TO-USE: The smoketest scenario driver, immediately before it stamps a canned prompt override
 * on a pending work item.
 * WHEN-NOT-TO-USE: Anywhere outside the smoketest flow.
 *
 * WHICH ROLES HAVE VERIFICATION UNITS IS DATA, read out of `stepScopeStatics.byFamilyStep` rather than
 * matched against role names.
 *
 * The outstanding list comes from `signoffOutstandingTransformer`, the same enumeration
 * `get-qa-checklist` and the quest summary read. A second derivation here could disagree with them,
 * and a harness that signs a different set than those surfaces report would leave the fixture quest
 * looking inconsistent with itself.
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
} from '@dungeonmaster/shared/contracts';
import type { Flow, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { QaVerificationUnit } from '../../../contracts/qa-verification-unit/qa-verification-unit-contract';
import { qaUnitEnumerateTransformer } from '../../../transformers/qa-unit-enumerate/qa-unit-enumerate-transformer';
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

      const { role } = operationItem;
      if (role !== 'codeweaver' && role !== 'flowrider' && role !== 'siegemaster') {
        return { success: true as const };
      }

      const roleScope = {
        codeweaver: {
          flowTypes: ['runtime', 'operational'] as const,
          unitKinds: ['terminal', 'branch', 'observable'] as const,
        },
        flowrider: {
          flowTypes: ['runtime'] as const,
          unitKinds: ['terminal', 'branch', 'observable'] as const,
        },
        siegemaster: {
          flowTypes: ['runtime', 'operational'] as const,
          unitKinds: ['terminal', 'branch', 'observable', 'off-map'] as const,
        },
      }[role];

      const scopedFlowIds = new Set(operationItem.flowIds.map(String));
      const eligibleFlowTypes = new Set<Flow['flowType']>(roleScope.flowTypes);
      const targetFlows = loadedQuest.flows
        .filter((flow) => eligibleFlowTypes.has(flow.flowType))
        .filter((flow) => scopedFlowIds.has(String(flow.id)));
      if (targetFlows.length === 0) {
        return { success: true as const };
      }

      const eligibleKinds = new Set<QaVerificationUnit['kind']>(roleScope.unitKinds);
      const outstanding = targetFlows.flatMap((flow) =>
        qaUnitEnumerateTransformer({ flow })
          .filter((unit) => eligibleKinds.has(unit.kind))
          .map((unit) => unit.id),
      );
      if (outstanding.length === 0) {
        return { success: true as const };
      }

      const updatedQuest = questContract.parse({
        ...loadedQuest,
        flows: loadedQuest.flows.map((flow) =>
          smoketestFlowSignoffApplyTransformer({
            flow,
            unitIds: outstanding,
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
