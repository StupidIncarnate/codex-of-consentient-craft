/**
 * PURPOSE: Builds the Start-Quest relay seed for a quest: appends the quest type's implementation
 * operation items — every one of them DERIVED here rather than authored at spec time, scoped to the
 * union of the flow nodes' package tags since no author was there to declare it — plus the fixed
 * verify tail to the operations ledger, and creates ONE work item for the
 * first actionable (pending) operation item so the dispatch loop has something to pick up. Runs at
 * Start, before any worktree exists, so it stamps no `baseRef` — riftcarver, the head-of-relay
 * command role that creates the worktree, is the sole writer of that field, reading it from the
 * worktree's own HEAD once the worktree is real rather than from wherever this process's cwd
 * happens to be checked out.
 *
 * HOW one tail seed becomes N items is data on the registry entry (`fanOutBy`), read by
 * `relayTailFanOutTransformer` — this broker mints whatever slices come back and matches on no role
 * name at all. Codeweaver items are then reordered dependencies-first off `quest.packageGraph`.
 *
 * USAGE:
 * const { operations, workItems } = questBuildRelayGraphBroker({ quest, priorWorkItemIds, now });
 * // operations = FULL replacement ledger (plan items completed + tail appended, first actionable
 * //   marked in_progress); workItems = the single first work item, linked operations/<id>.
 * // Persist both via questOperationsUpdateBroker (NOT questModifyBroker — this writes the ledger).
 *
 * WHEN-TO-USE: Once per Start Quest transition, from OrchestrationStartResponder, after checking
 *   the tail has not already been appended (idempotency lives in the responder). Re-calling this
 *   broker directly on an already-seeded quest (e.g. quest-hydrate-broker) is also safe — it is a
 *   pure function of its inputs.
 */

import {
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  OperationItem,
  PackageName,
  Quest,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { isChatWorkItemRoleGuard, isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { operationsCodeweaverOrderTransformer } from '../../../transformers/operations-codeweaver-order/operations-codeweaver-order-transformer';
import { relayTailFanOutTransformer } from '../../../transformers/relay-tail-fan-out/relay-tail-fan-out-transformer';

export const questBuildRelayGraphBroker = ({
  quest,
  priorWorkItemIds,
  now,
}: {
  quest: Quest;
  priorWorkItemIds: QuestWorkItemId[];
  now: IsoTimestamp;
}): { operations: OperationItem[]; workItems: WorkItem[] } => {
  const registry = questTypeRegistryStatics[quest.questType];

  // Intake plan items (every chat role — chaoswhisperer/glyphsmith/bughunt) are done by the time
  // the user starts the quest — force any the intake agent forgot to complete, so advance never
  // tries to dispatch a fresh chat session for them.
  const settledExisting = quest.operations.map((operation) =>
    isChatWorkItemRoleGuard({ role: operation.role }) && operation.status !== 'complete'
      ? operationItemContract.parse({ ...operation, status: 'complete' })
      : operation,
  );

  // Every package the quest's spine is tagged with, first-tagged order, deduplicated. A feature
  // quest's implementation items are authored by Chaos and carry their own declared scope; the
  // orchestrator-seeded ones are minted here with no author to declare anything, so the node tags
  // are the only statement of where the work lands — and an item seeded without them reaches its
  // session declaring no packages at all, which is the whole-quest search this slicing removes.
  const spinePackages = new Map<unknown, PackageName>();
  for (const flow of quest.flows) {
    for (const node of flow.nodes) {
      for (const packageName of node.packages) {
        spinePackages.set(String(packageName), packageName);
      }
    }
  }

  // Implementation seeds expand through the SAME `fanOutBy` transformer the tail uses, so the one
  // codeweaver seed becomes the derived per-package ledger while the riftcarver seed — which
  // declares no `fanOutBy` — still becomes exactly one item.
  //
  // `locked` defaults true and codeweaver sets it false: locking is what enrols an item in its
  // role's `slotManagerStatics` pt budget, and a codeweaver chain must stay unbounded because the
  // flows are the acceptance target. Deletion protection no longer depends on it — `operations` is
  // off the modify-quest allowlist entirely.
  const implementationOps = registry.startImplementationOps.flatMap((seed) => {
    const locked = 'locked' in seed ? seed.locked : true;

    return relayTailFanOutTransformer({ entry: seed, quest }).map((slice) =>
      operationItemContract.parse({
        id: crypto.randomUUID(),
        role: seed.role,
        text: slice.text,
        status: 'pending',
        locked,
        flowIds: slice.flowIds,
        // A slice that names its own packages IS the scope. The spine fallback is for a seed that
        // fans out to one whole-quest item: no author declared anything, so the node tags are the
        // only statement of where the work lands, and an item seeded without them reaches its
        // session declaring no packages at all.
        //
        // A COMMAND role is excluded from that fallback: `packageNames` exists to narrow an agent's
        // search to its slice, and the dispatcher runs a command itself with no prompt to narrow.
        // Inheriting the whole spine there would write a scope onto the ledger that nothing reads
        // and that claims riftcarver builds only the packages the flows happen to tag — when what
        // it actually prepares is the entire worktree.
        packageNames:
          slice.packageNames.length > 0
            ? slice.packageNames
            : isCommandWorkItemRoleGuard({ role: seed.role })
              ? []
              : [...spinePackages.values()],
      }),
    );
  });

  // Tail seeds expand in registry order, and HOW one seed becomes N items is the registry's own
  // `fanOutBy` rather than a role-name chain here: this broker mints items and never learns which
  // role it is holding. `relayTailFanOutTransformer` owns every slicing rule.
  const tailOps = registry.relayTail.flatMap((entry) => {
    const seed = {
      role: entry.role,
      status: 'pending',
      locked: true,
      ...('wardMode' in entry ? { wardMode: entry.wardMode } : {}),
    };

    return relayTailFanOutTransformer({ entry, quest }).map((slice) =>
      operationItemContract.parse({
        ...seed,
        id: crypto.randomUUID(),
        text: slice.text,
        flowIds: slice.flowIds,
        packageNames: slice.packageNames,
      }),
    );
  });

  // Dependencies first, ties in the order Chaos authored them. A pure reorder of the codeweaver
  // items alone, applied before the ledger is assembled so the tail is never touched.
  const orderedExisting = operationsCodeweaverOrderTransformer({
    operations: settledExisting,
    packageGraph: quest.packageGraph,
  });

  const operations = [...orderedExisting, ...implementationOps, ...tailOps];

  const firstActionable = operations.find((operation) => operation.status === 'pending');
  if (firstActionable === undefined) {
    return { operations, workItems: [] };
  }

  const firstWorkItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: firstActionable.role,
    status: 'pending',
    spawnerType: isCommandWorkItemRoleGuard({ role: firstActionable.role }) ? 'command' : 'agent',
    relatedDataItems: [`operations/${String(firstActionable.id)}`],
    dependsOn: priorWorkItemIds,
    maxAttempts: 1,
    createdAt: now,
    ...(firstActionable.wardMode === undefined ? {} : { wardMode: firstActionable.wardMode }),
  });

  return {
    operations: operations.map((operation) =>
      operation.id === firstActionable.id
        ? operationItemContract.parse({ ...operation, status: 'in_progress' })
        : operation,
    ),
    workItems: [firstWorkItem],
  };
};
