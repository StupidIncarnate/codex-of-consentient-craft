/**
 * PURPOSE: Extracts related contracts, observables, and requirements from a quest for a given step
 *
 * USAGE:
 * const context = stepToQuestContextTransformer({ step, quest });
 * // Returns { relatedContracts, relatedObservables, relatedRequirements } filtered subsets
 */

import type {
  DependencyStep,
  Observable,
  Quest,
  QuestContractEntry,
  Requirement,
} from '@dungeonmaster/shared/contracts';

export const stepToQuestContextTransformer = ({
  step,
  quest,
}: {
  step: DependencyStep;
  quest: Quest;
}): {
  relatedContracts: QuestContractEntry[];
  relatedObservables: Observable[];
  relatedRequirements: Requirement[];
} => {
  const contractNames = new Set([...step.inputContracts, ...step.outputContracts]);

  const relatedContracts = quest.contracts.filter((contract) => contractNames.has(contract.name));

  const observableIds = new Set(step.observablesSatisfied);

  const relatedObservables = quest.observables.filter((observable) =>
    observableIds.has(observable.id),
  );

  const requirementIds = new Set(
    relatedObservables
      .filter(
        (
          observable,
        ): observable is Observable & { requirementId: NonNullable<Observable['requirementId']> } =>
          observable.requirementId !== undefined,
      )
      .map((observable) => observable.requirementId),
  );

  const relatedRequirements = quest.requirements.filter((requirement) =>
    requirementIds.has(requirement.id),
  );

  return {
    relatedContracts,
    relatedObservables,
    relatedRequirements,
  };
};
