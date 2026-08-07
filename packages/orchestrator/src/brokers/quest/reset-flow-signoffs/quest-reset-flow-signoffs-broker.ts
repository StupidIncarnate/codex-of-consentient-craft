/**
 * PURPOSE: Clears Siegemaster's verification sign-offs across ONE flow under the quest-modify lock,
 * and records a `walk-reset` note saying why
 *
 * USAGE:
 * await questResetFlowSignoffsBroker({ questId, workItemId, flowId, reason });
 * // Returns { clearedCount, noteId } — every siegemasterSignoff on that flow is gone, flowriderSignoff is untouched
 *
 * WHEN-TO-USE: A Siegemaster session walked a flow, found a defect, and fixed it. Every sign-off it
 * already wrote on that flow now measures a system that no longer exists, so the honest move is to
 * clear its own track and re-walk. Flowrider's track is NEVER touched — the two tracks are
 * independent and Flowrider's tests were not invalidated by a Siegemaster repair.
 * WHEN-NOT-TO-USE: To clear a sign-off on a single unit — write that unit's sign-off through
 * modify-quest with `null` instead. This is the whole-flow lever.
 *
 * Bypasses `questModifyBroker` because it is a read-modify-write over the WHOLE flow rather than an
 * upsert of a caller-supplied patch, so it takes the public `questWithModifyLockBroker` itself and
 * persists through `questPersistBroker` — the outbox append is what drives the WebSocket
 * `quest-modified` broadcast the browser re-renders on.
 *
 * The clear is a KEY REMOVAL (`Reflect.deleteProperty`), not a `null` write. `null` is the clear
 * marker on the modify-quest deep-merge path only; here the loaded quest object is mutated directly
 * and re-parsed, and `signoffContract.optional()` does not accept `null`.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  questNoteContract,
} from '@dungeonmaster/shared/contracts';
import type { FlowId, QuestId, QuestNote, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { ResetFlowSignoffsResult } from '../../../contracts/reset-flow-signoffs-result/reset-flow-signoffs-result-contract';
import { resetFlowSignoffsResultContract } from '../../../contracts/reset-flow-signoffs-result/reset-flow-signoffs-result-contract';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;
const OPERATIONS_REF_PREFIX = 'operations/';
const SIGNOFF_FIELD = 'siegemasterSignoff';

export const questResetFlowSignoffsBroker = async ({
  questId,
  workItemId,
  flowId,
  reason,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  flowId: FlowId;
  reason: QuestNote['detail'];
}): Promise<ResetFlowSignoffsResult> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<ResetFlowSignoffsResult> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );

      const loadedQuest = await questLoadBroker({ questFilePath });

      // There is no ambient caller identity over MCP stdio, so the work item id IS the caller's
      // claim of who it is. An id that is not on this quest is a wrong, stale or fabricated one —
      // reporting success for it would tell the session its walk was reset when nothing moved.
      const workItem = loadedQuest.workItems.find((item) => item.id === workItemId);
      if (workItem === undefined) {
        throw new Error(
          `reset-flow-signoffs: work item ${workItemId} is not on quest ${questId} — nothing was reset`,
        );
      }

      const linkedRef = workItem.relatedDataItems
        .map((ref) => String(ref))
        .find((ref) => ref.startsWith(OPERATIONS_REF_PREFIX));
      const linkedId = linkedRef?.split('/')[1];
      const operationItem = loadedQuest.operations.find((item) => item.id === linkedId);

      if (operationItem === undefined) {
        throw new Error(
          `reset-flow-signoffs: work item ${workItemId} has no linked operation item on quest ${questId}, so it declares no flow scope — nothing was reset`,
        );
      }

      // Only Siegemaster owns this track. A reset from any other role would silently discard
      // sign-offs the resetting session has no way to re-earn.
      if (operationItem.role !== 'siegemaster') {
        throw new Error(
          `reset-flow-signoffs: only a siegemaster work item may reset a walk — work item ${workItemId} is linked to a ${operationItem.role} operation item (${String(operationItem.id)})`,
        );
      }

      // The operation item's flowIds ARE a siegemaster item's coverage scope (the same list the
      // signal-back completion gate measures `done` against), so a flow outside it belongs to a
      // different session's budget and a different session's walk.
      const inScope = operationItem.flowIds.some((scoped) => scoped === flowId);
      if (!inScope) {
        const scope =
          operationItem.flowIds.length === 0
            ? 'no flows at all'
            : operationItem.flowIds.map((scoped) => String(scoped)).join(', ');
        throw new Error(
          `reset-flow-signoffs: flow ${flowId} is outside the scope of work item ${workItemId}, whose operation item ${String(operationItem.id)} covers ${scope} — nothing was reset`,
        );
      }

      const targetFlow = loadedQuest.flows.find((flow) => flow.id === flowId);
      if (targetFlow === undefined) {
        throw new Error(
          `reset-flow-signoffs: flow ${flowId} is not on quest ${questId} — nothing was reset`,
        );
      }

      // Every unit shape that carries the two sign-off fields as top-level siblings: nodes, the
      // observables embedded in them, edges, and the off-map probe families.
      const signedUnits = [
        ...targetFlow.nodes,
        ...targetFlow.nodes.flatMap((node) => node.observables),
        ...targetFlow.edges,
        ...targetFlow.offMapSignoffs,
      ];

      const clearedCount = signedUnits.filter(
        (unit) => unit.siegemasterSignoff !== undefined,
      ).length;

      for (const unit of signedUnits) {
        Reflect.deleteProperty(unit, SIGNOFF_FIELD);
      }

      // Notes are keyed on id and upserted elsewhere, so a second reset of the same flow must not
      // collide with the first. Numbering off the walk-resets already recorded for this flow keeps
      // each reset its own durable entry.
      const priorResets = loadedQuest.planningNotes.questNotes.filter(
        (note) => note.kind === 'walk-reset' && note.flowId === flowId,
      ).length;

      const note = questNoteContract.parse({
        id: `walk-reset-${String(flowId)}-${String(priorResets + 1)}`,
        kind: 'walk-reset',
        role: 'siegemaster',
        workItemId,
        flowId,
        summary: `Siegemaster walk reset for flow ${String(flowId)} — ${String(clearedCount)} sign-off(s) cleared`,
        detail: reason,
        at: new Date().toISOString(),
      });

      const updatedQuest = questContract.parse({
        ...loadedQuest,
        planningNotes: {
          ...loadedQuest.planningNotes,
          questNotes: [...loadedQuest.planningNotes.questNotes, note],
        },
        updatedAt: new Date().toISOString(),
      });

      const questJson = fileContentsContract.parse(
        JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
      );

      await questPersistBroker({ questFilePath, contents: questJson, questId });

      return resetFlowSignoffsResultContract.parse({ clearedCount, noteId: note.id });
    },
  });
