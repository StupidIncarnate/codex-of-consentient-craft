/**
 * PURPOSE: Whether a step declares `mintableOnRequest: true` in its family's own step graph —
 * `quest-work`'s `request` payload may name only a step this returns `true` for, so a session cannot
 * conjure an arbitrary step. Reads `agentFlowStatics` through a widened, index-signature view (the
 * real `as const` object's literal keys refuse a computed string index, the same reason
 * `next-action-transformer.ts` takes its own copy of this shape as a parameter).
 *
 * USAGE:
 * isStepMintableOnRequestGuard({ family: AgentFamilyNameStub({ value: 'siegemaster' }), step: StepNameStub({ value: 'recipe' }) });
 * // Returns true
 */

import type { StepName } from '@dungeonmaster/shared/contracts';

import type { AgentFamilyName } from '../../contracts/agent-family-name/agent-family-name-contract';
import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';

const agentFlowGraphs: Readonly<
  Record<
    PropertyKey,
    | { steps: Readonly<Record<PropertyKey, { mintableOnRequest?: boolean } | undefined>> }
    | undefined
  >
> = agentFlowStatics as never;

export const isStepMintableOnRequestGuard = ({
  family,
  step,
}: {
  family?: AgentFamilyName;
  step?: StepName;
}): boolean => {
  if (family === undefined || step === undefined) {
    return false;
  }

  const graph = agentFlowGraphs[String(family)];
  const node = graph?.steps[String(step)];

  return node?.mintableOnRequest === true;
};
