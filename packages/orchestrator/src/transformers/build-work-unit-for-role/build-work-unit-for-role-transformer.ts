/**
 * PURPOSE: Builds a WorkUnit for the given role from a dependency step and quest context
 *
 * USAGE:
 * const workUnit = buildWorkUnitForRoleTransformer({ role: 'codeweaver', step, quest });
 * // Returns CodeweaverWorkUnit { role: 'codeweaver', step, questId, relatedContracts, relatedObservables, relatedRequirements }
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
      const { relatedContracts, relatedObservables, relatedRequirements } =
        stepToQuestContextTransformer({ step, quest });

      return workUnitContract.parse({
        role: 'codeweaver',
        step,
        questId: quest.id,
        relatedContracts,
        relatedObservables,
        relatedRequirements,
      });
    }

    case 'siegemaster': {
      const observableIds = new Set(step.observablesSatisfied);

      const observables = quest.observables.filter((observable) =>
        observableIds.has(observable.id),
      );

      const contextIds = new Set(observables.map((observable) => observable.contextId));

      const contexts = quest.contexts.filter((context) => contextIds.has(context.id));

      return workUnitContract.parse({
        role: 'siegemaster',
        questId: quest.id,
        observables,
        contexts,
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
