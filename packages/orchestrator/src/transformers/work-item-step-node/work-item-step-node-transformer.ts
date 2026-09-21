/**
 * PURPOSE: The `agentFlowStatics` step node one work item is running, typed. Reach for this over
 * walking `quest → operation item → family → steps` at a call site: the six families' `steps` maps
 * are differently shaped under `as const`, so indexing one with a string collapses its key set to
 * `never` and `Object.entries` widens the value to `any` — which is how a dispatcher ends up
 * branching on an untyped `kind`.
 *
 * USAGE:
 * workItemStepNodeTransformer({ quest, workItem })?.kind;
 * // Returns 'prompt' | 'deterministic', or undefined for a work item that runs no step graph
 *
 * A WORK ITEM CARRYING NO `step` RESOLVES TO `undefined`, deliberately — no entry-step fallback.
 * That fallback belongs where a session is being SERVED its scope (`get-quest-work` takes it), but
 * here it would give a hydrated or pre-graph work item a step it never ran, and the dispatcher would
 * route it by a node nothing put it at.
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { agentStepNodeContract } from '../../contracts/agent-step-node/agent-step-node-contract';
import type { AgentStepNode } from '../../contracts/agent-step-node/agent-step-node-contract';
import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { workItemFamilyResolveTransformer } from '../work-item-family-resolve/work-item-family-resolve-transformer';
import { workItemLinkedOperationResolveTransformer } from '../work-item-linked-operation-resolve/work-item-linked-operation-resolve-transformer';

export const workItemStepNodeTransformer = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): AgentStepNode | undefined => {
  if (workItem.step === undefined) {
    return undefined;
  }

  const operationItem = workItemLinkedOperationResolveTransformer({ quest, workItem });

  if (operationItem === undefined) {
    return undefined;
  }

  const family = workItemFamilyResolveTransformer({ quest, operationItem });

  if (family === undefined) {
    return undefined;
  }

  const steps = Object.entries(agentFlowStatics).find(([name]) => name === String(family))?.[1]
    .steps;

  if (steps === undefined) {
    return undefined;
  }

  // Declared `unknown`: `Object.entries` over a union of six differently-shaped `steps` maps widens
  // the value to `any`, and an `any` walked into a return is a `kind` nothing checked.
  const node: unknown = Object.entries(steps).find(([name]) => name === String(workItem.step))?.[1];

  // `safeParse`, not `parse`: the step-name contract is free-form so a quest.json naming a retired
  // step still loads, and a dispatcher reading one gets an answer — this item runs no known node —
  // rather than a throw that stops the whole scan.
  return node === undefined ? undefined : agentStepNodeContract.safeParse(node).data;
};
