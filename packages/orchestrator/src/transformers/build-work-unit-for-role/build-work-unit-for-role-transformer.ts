/**
 * PURPOSE: Builds a WorkUnit for the given role from a dependency step and quest context
 *
 * USAGE:
 * const workUnit = buildWorkUnitForRoleTransformer({ role: 'codeweaver', step, quest });
 * // Returns CodeweaverWorkUnit { role: 'codeweaver', step, questId, relatedContracts, relatedObservables }
 */

import type { DependencyStep, Quest } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';
import { workUnitContract } from '../../contracts/work-unit/work-unit-contract';
import { stepToFilePathsTransformer } from '../step-to-file-paths/step-to-file-paths-transformer';
import { stepToQuestContextTransformer } from '../step-to-quest-context/step-to-quest-context-transformer';

export const buildWorkUnitForRoleTransformer = ({
  role,
  step,
  quest,
}: {
  role: AgentRole;
  step: DependencyStep;
  quest: Quest;
}): WorkUnit => {
  switch (role) {
    case 'codeweaver': {
      const { relatedContracts, relatedObservables, relatedDesignDecisions, relatedFlows } =
        stepToQuestContextTransformer({
          step,
          quest,
        });

      return workUnitContract.parse({
        role: 'codeweaver',
        step,
        questId: quest.id,
        relatedContracts,
        relatedObservables,
        relatedDesignDecisions,
        relatedFlows,
      });
    }

    case 'siegemaster': {
      const observableIds = new Set(step.observablesSatisfied);

      const observables = quest.flows
        .flatMap((flow) => flow.nodes.flatMap((node) => node.observables))
        .filter((observable) => observableIds.has(observable.id));

      return workUnitContract.parse({
        role: 'siegemaster',
        questId: quest.id,
        observables,
      });
    }

    case 'lawbringer': {
      const filePaths = stepToFilePathsTransformer({ step });

      return workUnitContract.parse({
        role: 'lawbringer',
        filePaths,
      });
    }

    case 'spiritmender': {
      const filePaths = stepToFilePathsTransformer({ step });

      return workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
      });
    }

    case 'pathseeker': {
      throw new Error('Role "pathseeker" is not step-based and cannot be built from a step');
    }

    default: {
      const exhaustiveCheck: never = role;
      throw new Error(`Unknown role: ${String(exhaustiveCheck)}`);
    }
  }
};
