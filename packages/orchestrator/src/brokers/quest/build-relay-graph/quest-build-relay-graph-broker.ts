/**
 * PURPOSE: Builds the Start-Quest relay seed for a quest: appends the quest type's implementation
 * operation items (bug-hunt's pesteater; feature quests already carry Chaos-authored codeweaver
 * items) plus the fixed verify tail to the operations ledger, and creates ONE work item for the
 * first actionable (pending) operation item so the dispatch loop has something to pick up.
 *
 * A verify-tail `forEachFlow` group (flowrider + siegemaster) fans out into one operation item per
 * quest flow, so each of those sessions owns exactly ONE flow.
 *
 * USAGE:
 * const { operations, workItems } = questBuildRelayGraphBroker({ quest, priorWorkItemIds, now });
 * // operations = FULL replacement ledger (plan items completed + tail appended, first actionable
 * //   marked in_progress); workItems = the single first work item, linked operations/<id>.
 * // Persist both via questOperationsUpdateBroker (NOT questModifyBroker — this writes the ledger).
 *
 * WHEN-TO-USE: Once per Start Quest transition, from OrchestrationStartResponder, after checking
 *   the tail has not already been appended (idempotency lives in the responder).
 */

import {
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  Flow,
  OperationItem,
  Quest,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';

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

  // Intake plan items (chaoswhisperer/glyphsmith) are done by the time the user starts the
  // quest — force any the intake agent forgot to complete, so advance never tries to dispatch
  // a fresh chat session for them.
  const settledExisting = quest.operations.map((operation) =>
    (operation.role === 'chaoswhisperer' || operation.role === 'glyphsmith') &&
    operation.status !== 'complete'
      ? operationItemContract.parse({ ...operation, status: 'complete' })
      : operation,
  );

  const implementationOps = registry.startImplementationOps.map((seed) =>
    operationItemContract.parse({
      id: crypto.randomUUID(),
      role: seed.role,
      text: seed.text,
      status: 'pending',
      locked: true,
    }),
  );

  // What a `forEachFlow` group repeats over. A flow-less quest gets ONE flow-less pass per group
  // member rather than losing the role entirely: the approval gate only guarantees flows on a real
  // feature quest, while hydrate and the smoketest blueprints start with none.
  const groupFlows: (Flow | undefined)[] =
    quest.flows.length === 0 ? [undefined] : [...quest.flows];

  // A `forEachFlow` group repeats once per quest flow in DECLARATION order, keeping its own internal
  // order — so flow A's authoring and its QA both land before flow B starts, because the flows have
  // an order of operation between them.
  //
  // The flow id rides in the TEXT as well as `flowIds`, because operationPtChainTransformer keys a
  // pt-continuation chain on role + base text: identical texts would pool every flow's retries into
  // one budget. The id (not the name) is the key, so renaming a flow cannot split a live chain.
  const tailOps = registry.relayTail.flatMap((entry) =>
    'forEachFlow' in entry
      ? groupFlows.flatMap((flow) =>
          entry.forEachFlow.map((seed) =>
            operationItemContract.parse({
              id: crypto.randomUUID(),
              role: seed.role,
              text: flow === undefined ? seed.text : `${seed.text} — flow: ${String(flow.id)}`,
              status: 'pending',
              locked: true,
              ...(flow === undefined ? {} : { flowIds: [flow.id] }),
            }),
          ),
        )
      : [
          operationItemContract.parse({
            id: crypto.randomUUID(),
            role: entry.role,
            text: entry.text,
            status: 'pending',
            locked: true,
            ...('wardMode' in entry ? { wardMode: entry.wardMode } : {}),
          }),
        ],
  );

  const operations = [...settledExisting, ...implementationOps, ...tailOps];

  const firstActionable = operations.find((operation) => operation.status === 'pending');
  if (firstActionable === undefined) {
    return { operations, workItems: [] };
  }

  const firstWorkItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: firstActionable.role,
    status: 'pending',
    spawnerType: firstActionable.role === 'ward' ? 'command' : 'agent',
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
