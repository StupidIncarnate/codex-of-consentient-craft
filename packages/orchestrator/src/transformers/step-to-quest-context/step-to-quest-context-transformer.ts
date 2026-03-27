/**
 * PURPOSE: Extracts related contracts, observables, design decisions, and flows from a quest for a given step
 *
 * USAGE:
 * const context = stepToQuestContextTransformer({ step, quest });
 * // Returns { relatedContracts, relatedObservables, relatedDesignDecisions, relatedFlows } filtered subsets
 */

import type {
  DependencyStep,
  DesignDecision,
  Flow,
  FlowNodeId,
  FlowObservable,
  Quest,
  QuestContractEntry,
} from '@dungeonmaster/shared/contracts';

export const stepToQuestContextTransformer = ({
  step,
  quest,
}: {
  step: DependencyStep;
  quest: Quest;
}): {
  relatedContracts: QuestContractEntry[];
  relatedObservables: FlowObservable[];
  relatedDesignDecisions: DesignDecision[];
  relatedFlows: Flow[];
} => {
  const contractNames = new Set([...step.inputContracts, ...step.outputContracts]);

  const relatedContracts = quest.contracts.filter((contract) => contractNames.has(contract.name));

  const observableIds = new Set(step.observablesSatisfied);

  const allObservables = quest.flows.flatMap((flow) =>
    flow.nodes.flatMap((node) => node.observables),
  );

  const relatedObservables = allObservables.filter((observable) =>
    observableIds.has(observable.id),
  );

  const matchingNodeIds = new Set<FlowNodeId>();

  for (const flow of quest.flows) {
    for (const node of flow.nodes) {
      const hasMatchingObservable = node.observables.some((obs) => observableIds.has(obs.id));

      if (hasMatchingObservable) {
        matchingNodeIds.add(node.id);
      }
    }
  }

  const relatedDesignDecisions = quest.designDecisions.filter((decision) =>
    decision.relatedNodeIds.some((nodeId) => matchingNodeIds.has(nodeId)),
  );

  const relatedFlows = quest.flows.filter((flow) =>
    flow.nodes.some((node) => node.observables.some((obs) => observableIds.has(obs.id))),
  );

  return {
    relatedContracts,
    relatedObservables,
    relatedDesignDecisions,
    relatedFlows,
  };
};
