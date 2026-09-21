/**
 * PURPOSE: MOVES a scope already in flight — asks the router what the operation item's family graph
 * does next and persists the answer, minting the next step's work items, completing the scope, or
 * halting the quest. Reach for this over `questAdvanceBroker` by WHICH SCOPE: that one opens a
 * scope nothing has entered, where this one is the only thing that carries an entered scope from one
 * step to the next.
 *
 * USAGE:
 * await questRouteScopeBroker({ questId });
 * // Returns { routed, blocked } — `routed` when the ledger changed, `blocked` when the quest halted
 *
 * IT ROUTES AT MOST ONE SCOPE PER CALL, the first `in_progress` one whose work items have ALL gone
 * terminal. A scope with a live work item has not finished its step, and the router's phase rule
 * would answer `capped` for it anyway.
 *
 * THE PLAN IS READ BEFORE THE LOCK, and that ordering is the reason this file exists rather than the
 * router being called from inside `questAdvanceBroker`. `questWithModifyLockBroker` is per-quest and
 * deliberately non-reentrant, `questOperationsUpdateBroker` takes it, and its `update` callback is
 * synchronous — so every await this decision needs happens above it.
 *
 * THE HALT IS PERFORMED AFTER THE PERSIST RETURNS, never inside the callback, for the same reason:
 * `questBlockOnFailureBroker` goes through `questModifyBroker`, which takes that same lock.
 *
 * A ROLE NO FAMILY CARRIES IS LEFT ALONE — `spiritmender`, a chat role, and the COMMITTED ward gate,
 * which shares its role with `wardFull` and is told apart by `wardMode`. None of them runs a step
 * graph, so each completes on its own signal exactly as before and this broker never touches it.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  errorMessageContract,
  filePathContract,
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type {
  ErrorMessage,
  OperationItem,
  Quest,
  QuestId,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import {
  isCommandWorkItemRoleGuard,
  isTerminalWorkItemStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';
import { locationsStatics, questFlowStatics } from '@dungeonmaster/shared/statics';

import { agentFlowStatics } from '../../../statics/agent-flow/agent-flow-statics';
import { familyLedgerKeyTransformer } from '../../../transformers/family-ledger-key/family-ledger-key-transformer';
import { nextActionTransformer } from '../../../transformers/next-action/next-action-transformer';
import { workItemFamilyResolveTransformer } from '../../../transformers/work-item-family-resolve/work-item-family-resolve-transformer';
import { plannedWorkReadBroker } from '../../planned-work/read/planned-work-read-broker';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';
import { mintNextFamilyLayerBroker } from './mint-next-family-layer-broker';

const OPERATIONS_REF_PREFIX = 'operations/';

export const questRouteScopeBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ routed: boolean; blocked: boolean }> => {
  // The quest folder and the quest itself come off ONE lookup, not two: `questGetBroker` would walk
  // the guilds again for a path this already holds, and the plan file lives beside `quest.json`.
  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const scanned: Quest = await questLoadBroker({ questFilePath });

  const candidate = scanned.operations.find((operation) => {
    if (operation.status !== 'in_progress') {
      return false;
    }

    const family = workItemFamilyResolveTransformer({ quest: scanned, operationItem: operation });

    // `wardMode` is what separates the FULL gate from the committed one, which carries the same
    // role and belongs to no family at all.
    if (
      family === undefined ||
      familyLedgerKeyTransformer({ family }).wardMode !== operation.wardMode
    ) {
      return false;
    }

    const scopeItems = scanned.workItems.filter((item) =>
      item.relatedDataItems
        .map((ref) => String(ref))
        .includes(`${OPERATIONS_REF_PREFIX}${String(operation.id)}`),
    );

    return (
      scopeItems.length > 0 &&
      scopeItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }))
    );
  });

  if (candidate === undefined) {
    return { routed: false, blocked: false };
  }

  // The last await the decision needs, ABOVE the lock. The router is pure and synchronous and
  // cannot go and look.
  const plan = await plannedWorkReadBroker({
    questFolderPath: questPath,
    operationItemId: candidate.id,
  });

  // An object holder, not a bare `let`: the values are assigned inside the update callback, which
  // TypeScript's flow analysis cannot see through.
  const halt: { workItemId?: QuestWorkItemId; reason?: ErrorMessage } = {};
  const persisted = await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      // Named `operation`, not `operationItem`: the ledger-status lint rule keys on an identifier
      // ending in `Item` and would read these as WORK-item statuses.
      const operation = quest.operations.find((item) => item.id === candidate.id);

      if (operation === undefined || operation.status !== 'in_progress') {
        return null;
      }

      const scopeRef = `${OPERATIONS_REF_PREFIX}${String(operation.id)}`;
      const scopeItems = quest.workItems.filter((item) =>
        item.relatedDataItems.map((ref) => String(ref)).includes(scopeRef),
      );

      if (
        scopeItems.length === 0 ||
        !scopeItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }))
      ) {
        return null;
      }

      // ARRAY order, never `createdAt` — a parallel batch is minted inside one persist and shares a
      // timestamp, so a sort over it is unstable. The router reads the ledger the same way.
      const last = scopeItems[scopeItems.length - 1];

      if (last === undefined) {
        return null;
      }

      const action = nextActionTransformer({
        quest,
        plan,
        operationItemId: operation.id,
        agentFlowStatics,
        questFlowStatics,
        // The four values a pure function cannot go and look for. `quest-work` writes each of them
        // onto the work item and this reads them straight back.
        ...(last.requestedStep === undefined || last.requestedReason === undefined
          ? {}
          : {
              request: {
                fromWorkItemId: last.id,
                step: last.requestedStep,
                reason: String(last.requestedReason),
              },
            }),
        ...(last.declaredWord === undefined ? {} : { declaredWord: last.declaredWord }),
        hitWall: last.declaredWord === 'wall',
      });

      if (action.kind === 'block') {
        halt.workItemId = last.id;
        halt.reason = errorMessageContract.parse(String(action.message));
        return null;
      }

      if (action.kind === 'complete') {
        const completedOperations = quest.operations.map((scope) =>
          scope.id === operation.id
            ? operationItemContract.parse({ ...scope, status: 'complete' })
            : scope,
        );

        const family = workItemFamilyResolveTransformer({ quest, operationItem: operation });

        if (family === undefined) {
          return { operations: completedOperations };
        }

        // A family's forward edge fires ONCE, on its LAST scope — nine codeweaver cells route to
        // flowrider on the ninth, not nine times.
        const key = familyLedgerKeyTransformer({ family });
        // `scope`, not `item`: the ledger-status lint rule keys on an identifier ending in `Item`
        // (and on the bare name `item`) and would read this as a WORK-item status.
        const familyDrained = completedOperations
          .filter((scope) => scope.role === key.role && scope.wardMode === key.wardMode)
          .every((scope) => scope.status === 'complete');

        if (!familyDrained) {
          return { operations: completedOperations };
        }

        const routes = Object.entries(questFlowStatics[quest.questType].families).find(
          ([name]) => name === String(family),
        )?.[1].routes;
        const target =
          routes === undefined
            ? undefined
            : Object.entries(routes).find(([outcome]) => outcome === action.outcome)?.[1];

        if (target === undefined) {
          return { operations: completedOperations };
        }

        const nextScopes: OperationItem[] = mintNextFamilyLayerBroker({
          quest: { ...quest, operations: completedOperations },
          target,
        });

        return { operations: [...completedOperations, ...nextScopes] };
      }

      // `cause: 'capped'` is the honest "come back" — a concurrency cap or a step still running —
      // and it is the only empty batch the contract carries. Nothing is written for it.
      if (action.batch.length === 0) {
        return null;
      }

      // Chained on the last work item OF THIS SCOPE whose status satisfies dependencies, so the
      // execution panel reads the step sequence and two scopes of one family stay independent of
      // each other.
      const predecessor = [...scopeItems]
        .reverse()
        .find((item) => satisfiesDependencyWorkItemStatusGuard({ status: item.status }));
      const createdAt = new Date().toISOString();

      const minted: WorkItem[] = action.batch.map((item) =>
        workItemContract.parse({
          id: questWorkItemIdContract.parse(crypto.randomUUID()),
          role: item.role,
          status: 'pending',
          spawnerType: isCommandWorkItemRoleGuard({ role: item.role }) ? 'command' : 'agent',
          relatedDataItems: [scopeRef],
          dependsOn: predecessor === undefined ? [] : [predecessor.id],
          maxAttempts: 1,
          createdAt,
          step: item.step,
          assignedUnitIds: item.assignedUnitIds,
          ...(item.pieceId === undefined ? {} : { pieceId: item.pieceId }),
          ...(item.payload === undefined ? {} : { payload: item.payload }),
          ...(item.mintedBy === undefined ? {} : { mintedBy: item.mintedBy }),
          // Copied off the step config by mintNextActionTransformer, spent by the lane broker at
          // dispatch and by workItemToPromptTransformer's instance-id line — never re-derived from
          // agentFlowStatics downstream. Omitted rather than `needsLane: false`, matching
          // `wardMode`/`packageNames` below: work items are the most numerous array on a quest, and
          // the near-universal case (no lane) must not materialise onto every row.
          ...(item.needsLane ? { needsLane: true } : {}),
          ...(operation.wardMode === undefined ? {} : { wardMode: operation.wardMode }),
          ...(operation.packageNames.length === 0 ? {} : { packageNames: operation.packageNames }),
        }),
      );

      return { workItems: [...quest.workItems, ...minted] };
    },
  });

  const { workItemId, reason } = halt;

  if (workItemId !== undefined) {
    await questBlockOnFailureBroker({
      questId,
      failedWorkItemId: workItemId,
      ...(reason === undefined ? {} : { reason }),
    });

    return { routed: false, blocked: true };
  }

  return { routed: persisted !== null, blocked: false };
};
