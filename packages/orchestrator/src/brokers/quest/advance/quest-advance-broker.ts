/**
 * PURPOSE: ENTERS a scope — finds the first actionable (pending) operation item on the quest ledger
 * and creates the ONE work item that starts it, at its family graph's ENTRY step, marking the
 * operation in_progress in the same atomic persist. Reach for this over `questRouteScopeBroker` by
 * WHICH SCOPE: that one moves a scope already in flight from one step to the next, where this is the
 * only thing that opens a scope nothing has entered.
 *
 * USAGE:
 * await questAdvanceBroker({ questId });
 * // Creates one work item for the first pending operation item (or does nothing).
 *
 * ONE OPERATION ITEM CARRIES MANY WORK ITEMS, and the resume guard is still correct because of
 * WHERE the rest are minted: the router only mints inside an operation item that is already
 * `in_progress`, so a `pending` item having a linked work item still means somebody already entered
 * this scope. Advance therefore does NOTHING there (its session is live, or orphan recovery will
 * resume it, or it is terminal and the item is already complete), and no duplicate entry is
 * possible across double signals, re-entrant scans or restarts.
 *
 * THE ENTRY STEP COMES OFF THE FAMILY, NOT THE ROLE. `agentFlowStatics[family].entry` names it, and
 * the family is resolved through `questFlowStatics` rather than read off `operationItem.role` —
 * `wardFull` carries `role: 'ward'`, so a role read back as a family key would enter the wrong
 * graph. A role no family carries (`spiritmender`, a chat role) gets NO `step` at all, which is the
 * honest record: nothing routes it, and it completes on its own signal.
 *
 * When NO pending operation item remains it creates nothing; the operation-aware status transformer
 * (inside questOperationsUpdateBroker, run by whichever write completed the last operation) is what
 * derives quest `complete`, off the family graph's position.
 */

import {
  adapterResultContract,
  operationItemContract,
  questWorkItemIdContract,
  stepNameContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { AdapterResult, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isCommandWorkItemRoleGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import { agentFlowStatics } from '../../../statics/agent-flow/agent-flow-statics';
import { familyLedgerKeyTransformer } from '../../../transformers/family-ledger-key/family-ledger-key-transformer';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

// A Map rather than a bare index: `AgentFamilyName` brands an OPEN string so a quest.json naming a
// retired family still loads, and indexing an `as const` object with one gives no key check.
const GRAPH_BY_FAMILY = new Map(Object.entries(agentFlowStatics));

export const questAdvanceBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<AdapterResult> => {
  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const nextOperation = quest.operations.find((operation) => operation.status === 'pending');
      if (nextOperation === undefined) {
        return null;
      }

      // Resume guard: a pending operation item with ANY linked work item has already been entered,
      // so it is not advance's to touch — never open the same scope twice.
      const operationRef = `operations/${String(nextOperation.id)}`;
      const alreadyLinked = quest.workItems.some((workItem) =>
        workItem.relatedDataItems.some((ref) => String(ref) === operationRef),
      );
      if (alreadyLinked) {
        return null;
      }

      // Chain the new item after the most recent work item whose status satisfies dependencies,
      // so dispatch ordering (and the execution panel's ordering) reads the relay sequence.
      const lastSatisfying = [...quest.workItems]
        .filter((workItem) => satisfiesDependencyWorkItemStatusGuard({ status: workItem.status }))
        .sort((a, b) =>
          String(a.completedAt ?? a.createdAt).localeCompare(String(b.completedAt ?? b.createdAt)),
        )
        .at(-1);

      const family = workItemFamilyResolveTransformer({ quest, operationItem: nextOperation });
      // `wardMode` is what separates the FULL gate from the COMMITTED one, which shares its role and
      // belongs to no family at all. The family resolver matches on role alone, so without this the
      // committed gate would be stamped with `wardFull`'s entry step and dispatch as a bare ward
      // over the whole monorepo.
      const entryStep =
        family === undefined ||
        familyLedgerKeyTransformer({ family }).wardMode !== nextOperation.wardMode
          ? undefined
          : GRAPH_BY_FAMILY.get(String(family))?.entry;

      const newWorkItem: WorkItem = workItemContract.parse({
        id: questWorkItemIdContract.parse(crypto.randomUUID()),
        role: nextOperation.role,
        status: 'pending',
        // The step the scope ENTERS at. Without it the router has no current step to read and
        // treats a scope with work items as one that has not started.
        ...(entryStep === undefined ? {} : { step: stepNameContract.parse(entryStep) }),
        // `spawnerType` is read off the command-role subset rather than a role name, so a role
        // added to `workItemRoleStatics.command` becomes a command here without an edit — a missed
        // edit would hand it to agentRoleContract, which throws on a name it does not enumerate.
        spawnerType: isCommandWorkItemRoleGuard({ role: nextOperation.role }) ? 'command' : 'agent',
        relatedDataItems: [operationRef],
        dependsOn: lastSatisfying === undefined ? [] : [lastSatisfying.id],
        maxAttempts: 1,
        createdAt: new Date().toISOString(),
        ...(nextOperation.wardMode === undefined ? {} : { wardMode: nextOperation.wardMode }),
        // The item's package slice travels with the session it is dispatched to. Omitted when the
        // operation declares none, which means "scoped to the whole quest" — writing an empty array
        // onto every work item would say the opposite while costing file size on every re-parse.
        ...(nextOperation.packageNames.length === 0
          ? {}
          : { packageNames: nextOperation.packageNames }),
      });

      return {
        operations: quest.operations.map((operation) =>
          operation.id === nextOperation.id
            ? operationItemContract.parse({ ...operation, status: 'in_progress' })
            : operation,
        ),
        workItems: [...quest.workItems, newWorkItem],
      };
    },
  });

  return adapterResultContract.parse({ success: true });
};
