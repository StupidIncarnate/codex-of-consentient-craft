/**
 * PURPOSE: Checks BOTH graph levels — the family graph (`questFlowStatics`) and each of the six
 * step graphs (`agentFlowStatics`) — and returns every reachability violation found. This is the
 * server-boot half of story 06's safety net: `packages/local-eslint` cannot reach
 * `agentFlowStatics` (it lives here, in `@dungeonmaster/orchestrator`, which local-eslint does not
 * depend on), so the step graphs are checked HERE instead. `packages/server` reaches this broker
 * via the `@dungeonmaster/orchestrator/brokers` subpath rather than the main barrel — that barrel
 * loads the whole package, which a short-lived caller has no use for.
 *
 * USAGE:
 * const violations = graphReachabilityCheckBroker();
 * // Returns [] when the family graph and all six step graphs are each internally consistent
 */
import { routedGraphContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';
import { graphReachabilityViolationsTransformer } from '@dungeonmaster/shared/transformers';
import { agentFlowStatics } from '../../../statics/agent-flow/agent-flow-statics';
import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { graphReachabilityCheckStatics } from '../../../statics/graph-reachability-check/graph-reachability-check-statics';

export const graphReachabilityCheckBroker = (): ErrorMessage[] => {
  const familyViolations = Object.entries(questFlowStatics).flatMap(([questType, family]) => {
    const graph = routedGraphContract.parse({
      graphName: questType,
      entry: family.entry,
      nodes: family.families,
    });
    return graphReachabilityViolationsTransformer({
      graph,
      terminals: graphReachabilityCheckStatics.familyTerminals,
      exemptFlag: 'appendedAtMerge',
      knownPrompts: [],
      knownHandlers: [],
    });
  });

  const stepViolations = Object.entries(agentFlowStatics).flatMap(([familyName, family]) => {
    const graph = routedGraphContract.parse({
      graphName: familyName,
      entry: family.entry,
      nodes: family.steps,
    });
    return graphReachabilityViolationsTransformer({
      graph,
      terminals: graphReachabilityCheckStatics.stepTerminals,
      exemptFlag: 'mintableOnRequest',
      knownPrompts: agentPromptClassificationStatics.promptNames,
      knownHandlers: graphReachabilityCheckStatics.knownHandlers,
    });
  });

  return [...familyViolations, ...stepViolations];
};
