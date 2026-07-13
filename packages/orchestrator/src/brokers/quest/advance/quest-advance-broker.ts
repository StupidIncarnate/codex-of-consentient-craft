/**
 * PURPOSE: Advances the operations relay — finds the first actionable (pending) operation item on
 * the quest ledger and creates its ONE work item, marking the operation in_progress in the same
 * atomic persist. The next get-next-step scan dispatches that work item.
 *
 * USAGE:
 * await questAdvanceBroker({ questId });
 * // Creates one work item for the first pending operation item (or does nothing).
 *
 * IDEMPOTENT + SAFE FROM BOTH CALLERS (signal-back handler AND the dispatch scan's self-heal):
 * - Advance acts ONLY on `pending` operation items. By the strict 1:1 invariant a pending item has
 *   no work item yet; if one somehow links to it already, advance does NOTHING (its session is
 *   live, or orphan recovery will resume it, or it is terminal and the item is already complete).
 *   No duplicate work item is possible — across double signals, re-entrant scans, and restarts.
 * - When NO pending operation item remains it creates nothing; the operation-aware status
 *   transformer (inside questOperationsUpdateBroker, run by whichever write completed the last
 *   operation) is what derives quest `complete`.
 */

import {
  adapterResultContract,
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { AdapterResult, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import { satisfiesDependencyWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

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

      // Strict-1:1 resume guard: a pending operation item with ANY linked work item is not
      // advance's to touch — never create a second work item for the same operation item.
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

      const newWorkItem: WorkItem = workItemContract.parse({
        id: questWorkItemIdContract.parse(crypto.randomUUID()),
        role: nextOperation.role,
        status: 'pending',
        spawnerType: nextOperation.role === 'ward' ? 'command' : 'agent',
        relatedDataItems: [operationRef],
        dependsOn: lastSatisfying === undefined ? [] : [lastSatisfying.id],
        maxAttempts: 1,
        createdAt: new Date().toISOString(),
        ...(nextOperation.wardMode === undefined ? {} : { wardMode: nextOperation.wardMode }),
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
