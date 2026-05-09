/**
 * PURPOSE: Returns descriptions of observables defined in flow nodes that are not claimed by any step or assertion (empty array = full coverage)
 *
 * USAGE:
 * questUnsatisfiedObservablesTransformer({flows, steps});
 * // Returns ErrorMessage[] — each entry names an unsatisfied observable id together with its
 * // owning flow id and node id, e.g. ["observable 'login-redirects-to-dashboard' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied"].
 *
 * WHEN-TO-USE: Save-time invariant during seek_synth/seek_walk to enforce that every observable
 * defined on a flow node is claimed by at least one step (step-level) or one assertion
 * (assertion-level). Pure set diff — required set is the union of all flow-node observable ids;
 * coverage set is the union of every step's observablesSatisfied and every assertion's
 * observablesSatisfied.
 *
 * WHEN-NOT-TO-USE: Quests with no flows or no observables trivially pass — there is nothing to cover.
 */
import type { DependencyStepStub, FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questUnsatisfiedObservablesTransformer = ({
  flows,
  steps,
}: {
  flows?: Flow[];
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!flows || flows.length === 0) {
    return [];
  }

  const coverage = new Set<unknown>();
  if (steps) {
    for (const step of steps) {
      for (const observableId of step.observablesSatisfied) {
        coverage.add(String(observableId));
      }
      for (const assertion of step.assertions) {
        if (!assertion.observablesSatisfied) {
          continue;
        }
        for (const observableId of assertion.observablesSatisfied) {
          coverage.add(String(observableId));
        }
      }
    }
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const flowId = String(flow.id);
    for (const node of flow.nodes) {
      const nodeId = String(node.id);
      for (const observable of node.observables) {
        const observableId = String(observable.id);
        if (coverage.has(observableId)) {
          continue;
        }
        offenders.push(
          errorMessageContract.parse(
            `observable '${observableId}' (flow '${flowId}', node '${nodeId}') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied`,
          ),
        );
      }
    }
  }

  return offenders;
};
