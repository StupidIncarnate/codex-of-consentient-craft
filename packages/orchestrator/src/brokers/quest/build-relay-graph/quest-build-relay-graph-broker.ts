/**
 * PURPOSE: Builds the Start-Quest relay seed for a quest: appends the ENTRY family's scopes to the
 * operations ledger and creates ONE work item for the first actionable (pending) one so the dispatch
 * loop has something to pick up. Runs at Start, before any worktree exists, so it stamps no
 * `baseRef` — riftcarver, the entry family and the one that creates the worktree, is the sole writer
 * of that field, reading it from the worktree's own HEAD once the worktree is real rather than from
 * wherever this process's cwd happens to be checked out.
 *
 * ONLY THE ENTRY FAMILY IS SEEDED, and that is the whole point. Every later family's scopes are
 * minted when the family graph ROUTES to it (`familyScopesMintTransformer`, from
 * `questRouteScopeBroker`), so a fan-out reads the flows AS THEY STAND then — which is what gives an
 * observable an operator adds mid-quest a flowrider session at all, where a scope cut at approval
 * could never have covered it. `questFlowStatics[quest.questType].entry` names the family; the
 * mint transformer owns every slicing rule and this broker matches on no role name at all.
 *
 * USAGE:
 * const { operations, workItems } = questBuildRelayGraphBroker({ quest, priorWorkItemIds, now });
 * // operations = FULL replacement ledger (intake items completed + the entry family's scopes
 * //   appended, first actionable marked in_progress); workItems = the single first work item,
 * //   linked operations/<id> and carrying its family's entry step.
 * // Persist both via questOperationsUpdateBroker (NOT questModifyBroker — this writes the ledger).
 *
 * WHEN-TO-USE: Once per Start Quest transition, from OrchestrationStartResponder, after checking
 *   the entry family's scopes are not already on the ledger (idempotency lives in the responder).
 *   Re-calling this broker directly on an already-seeded quest (e.g. quest-hydrate-broker) is also
 *   safe — it is a pure function of its inputs.
 */

import {
  operationItemContract,
  questWorkItemIdContract,
  stepNameContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  OperationItem,
  Quest,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { isChatWorkItemRoleGuard, isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import type { IsoTimestamp } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { agentFlowStatics } from '../../../statics/agent-flow/agent-flow-statics';
import { familyScopesMintTransformer } from '../../../transformers/family-scopes-mint/family-scopes-mint-transformer';
import { operationsCodeweaverOrderTransformer } from '../../../transformers/operations-codeweaver-order/operations-codeweaver-order-transformer';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';

const GRAPH_BY_FAMILY = new Map(Object.entries(agentFlowStatics));

export const questBuildRelayGraphBroker = ({
  quest,
  priorWorkItemIds,
  now,
}: {
  quest: Quest;
  priorWorkItemIds: QuestWorkItemId[];
  now: IsoTimestamp;
}): { operations: OperationItem[]; workItems: WorkItem[] } => {
  const entryFamily = questFlowStatics[quest.questType].entry;

  // Intake plan items (every chat role — chaoswhisperer/bughunt) are done by the time
  // the user starts the quest — force any the intake agent forgot to complete, so advance never
  // tries to dispatch a fresh chat session for them.
  const settledExisting = quest.operations.map((operation) =>
    isChatWorkItemRoleGuard({ role: operation.role }) && operation.status !== 'complete'
      ? operationItemContract.parse({ ...operation, status: 'complete' })
      : operation,
  );

  // The ENTRY family's scopes, and nothing else. `familyScopesMintTransformer` owns the fan-out,
  // the `locked` flag and the spine-package fallback; this broker mints nothing of its own and
  // learns no role name.
  const entryScopes = familyScopesMintTransformer({ quest, family: entryFamily });

  // Dependencies first, ties in the order Chaos authored them. A pure reorder of the codeweaver
  // items alone, applied before the ledger is assembled so nothing seeded here is touched.
  const orderedExisting = operationsCodeweaverOrderTransformer({
    operations: settledExisting,
    packageGraph: quest.packageGraph,
  });

  const operations = [...orderedExisting, ...entryScopes];

  const firstActionable = operations.find((operation) => operation.status === 'pending');
  if (firstActionable === undefined) {
    return { operations, workItems: [] };
  }

  // The step comes from firstActionable's OWN family, never the entry family: a re-seed or a
  // hydrated quest can already carry a pending operation from a family other than the one just
  // minted, and stamping the entry family's step onto it mints a step that family's own graph
  // never declares. Stamped here for the same reason advance stamps it: without it the router
  // reads a scope that has work items as one nothing has entered.
  const firstActionableFamily = workItemFamilyResolveTransformer({
    quest,
    operationItem: firstActionable,
  });
  const entryStep =
    firstActionableFamily === undefined
      ? undefined
      : GRAPH_BY_FAMILY.get(firstActionableFamily)?.entry;

  const firstWorkItem = workItemContract.parse({
    id: questWorkItemIdContract.parse(crypto.randomUUID()),
    role: firstActionable.role,
    status: 'pending',
    spawnerType: isCommandWorkItemRoleGuard({ role: firstActionable.role }) ? 'command' : 'agent',
    relatedDataItems: [`operations/${String(firstActionable.id)}`],
    dependsOn: priorWorkItemIds,
    maxAttempts: 1,
    createdAt: now,
    ...(entryStep === undefined ? {} : { step: stepNameContract.parse(entryStep) }),
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
