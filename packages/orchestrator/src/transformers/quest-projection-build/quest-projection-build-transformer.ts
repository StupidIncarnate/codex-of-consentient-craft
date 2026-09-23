/**
 * PURPOSE: Builds the likely remainder of a quest's execution — every MINTED scope's real work items,
 * in the order they ran, followed by the steps `routes.done` would reach if every one of them settles
 * clean. Reach for this over `nextActionTransformer` when the caller wants a preview to RENDER rather
 * than a decision to ACT on: this never mints, persists, or takes a lock.
 *
 * USAGE:
 * questProjectionBuildTransformer({ quest });
 * // Returns QuestProjection
 *
 * PURE. It reads the quest it is handed and nothing else, so the same quest file always produces the
 * same projection — mirroring `questSummaryBuildTransformer`'s own contract.
 *
 * ONLY MINTED SCOPES ARE WALKED — `quest.operations`, never `questFlowStatics` itself. A family the
 * relay has not yet routed to has no operation item and no fan-out count this function could compute
 * in advance (`codeweaver` alone ranges from one scope to one per (package, flow) cell, decided at
 * mint time), so it is simply absent from `scopes` rather than guessed at.
 *
 * THE WALK NEVER FOLDS AN OUTCOME AND NEVER CROSSES `routes.unmet`. `nextActionTransformer` asks "is
 * this step's actual work DONE right now" before it routes; this function does not — it assumes the
 * best case (every step drains to `done`) and reads `routes.done` alone, starting one hop past the
 * CURRENT step (the last work item on the scope, by ARRAY order — the identical rule
 * `nextActionTransformer`'s own header states, so the two can never disagree about where a scope
 * currently stands, and the test suite proves it: the first `planned` row this produces is exactly
 * what `nextActionTransformer` mints once that step's actual items fold to `done`).
 */

import type {
  Quest,
  QuestProjection,
  RoutedGraphNodeKey,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import {
  questProjectionContract,
  routedGraphNodeKeyContract,
  stepNameContract,
} from '@dungeonmaster/shared/contracts';
import { workItemStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { agentFlowFamilyResolveTransformer } from '../agent-flow-family-resolve/agent-flow-family-resolve-transformer';
import { agentFlowPlannedStepsWalkTransformer } from '../agent-flow-planned-steps-walk/agent-flow-planned-steps-walk-transformer';

export const questProjectionBuildTransformer = ({ quest }: { quest: Quest }): QuestProjection => {
  const scopes = quest.operations.map((operationItem) => {
    const graph = agentFlowFamilyResolveTransformer({ quest, operationItem });
    const scopeRef = `operations/${String(operationItem.id)}`;
    const scopeWorkItems = quest.workItems.filter((item: WorkItem) =>
      item.relatedDataItems.some((ref) => String(ref) === scopeRef),
    );

    // Real work items, in ARRAY order — never `createdAt`, since a parallel batch is minted inside
    // one persist and shares a timestamp. Mirrors `nextActionTransformer`'s own "current step" rule.
    const actualSteps = scopeWorkItems.flatMap((item) =>
      item.step === undefined
        ? []
        : [
            {
              step: item.step,
              kind: 'actual' as const,
              workItemId: item.id,
              ...(item.pieceId === undefined ? {} : { pieceId: item.pieceId }),
              status: item.status,
              ...(item.mintedBy === undefined ? {} : { mintedBy: item.mintedBy }),
            },
          ],
    );

    const lastStepped = [...scopeWorkItems].reverse().find((item) => item.step !== undefined);
    const currentStepKey: RoutedGraphNodeKey =
      lastStepped?.step === undefined
        ? graph.entry
        : routedGraphNodeKeyContract.parse(String(lastStepped.step));

    // A scope with no actual work items yet has not entered its entry step — the entry step ITSELF
    // is the first planned row. A scope already underway starts its planned tail one hop PAST the
    // current step, along that step's own `routes.done` — never the current step again. No separate
    // `'@done'` / `'@blocked'` check: `agentFlowPlannedStepsWalkTransformer` already stops the moment
    // a cursor names no declared node, which is what either terminal marker resolves to.
    const plannedStart: RoutedGraphNodeKey | undefined =
      actualSteps.length === 0 ? graph.entry : graph.nodes[currentStepKey]?.routes.done;

    const plannedSteps = agentFlowPlannedStepsWalkTransformer({ graph, cursor: plannedStart }).map(
      (step) => ({
        step: stepNameContract.parse(String(step)),
        kind: 'planned' as const,
      }),
    );

    return {
      operationId: operationItem.id,
      role: operationItem.role,
      text: operationItem.text,
      status: operationItem.status,
      steps: [...actualSteps, ...plannedSteps],
    };
  });

  return questProjectionContract.parse({
    questId: quest.id,
    scopes,
    // Summed rather than read off a running total: nothing on the quest stores either count, and a
    // stored total is a second source of truth — the exact trap `questSummaryBuildTransformer`'s own
    // history warns against for the identical reason.
    totalPlannedSteps: scopes.reduce((total, scope) => total + scope.steps.length, 0),
    completedSteps: scopes.reduce(
      (total, scope) =>
        total +
        scope.steps.filter(
          (row) =>
            row.kind === 'actual' && workItemStatusMetadataStatics.statuses[row.status].isComplete,
        ).length,
      0,
    ),
  });
};
