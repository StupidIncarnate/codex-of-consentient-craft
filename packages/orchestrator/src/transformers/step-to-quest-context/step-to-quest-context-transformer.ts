/**
 * PURPOSE: Extracts related contracts and observables from a quest for a given step
 *
 * USAGE:
 * const context = stepToQuestContextTransformer({ step, quest });
 * // Returns { relatedContracts, relatedObservables } filtered subsets
 */

import type {
  DependencyStep,
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

  return {
    relatedContracts,
    relatedObservables,
  };
};
