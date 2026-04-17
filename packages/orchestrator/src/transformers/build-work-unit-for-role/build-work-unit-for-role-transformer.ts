/**
 * PURPOSE: Builds a WorkUnit for the given role from role-specific inputs via a discriminated union
 *
 * USAGE:
 * const workUnit = buildWorkUnitForRoleTransformer({ role: 'codeweaver', step, quest });
 * // Returns CodeweaverWorkUnit { role: 'codeweaver', step, questId, relatedContracts, relatedObservables, ... }
 * const siegeUnit = buildWorkUnitForRoleTransformer({ role: 'siegemaster', flow, quest, devServerUrl });
 * // Returns SiegemasterWorkUnit { role: 'siegemaster', questId, flow, relatedDesignDecisions, devServerUrl? }
 */

import type { DependencyStep, Flow, Quest } from '@dungeonmaster/shared/contracts';

import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';
import { workUnitContract } from '../../contracts/work-unit/work-unit-contract';
import { stepToFilePathsTransformer } from '../step-to-file-paths/step-to-file-paths-transformer';
import { stepToQuestContextTransformer } from '../step-to-quest-context/step-to-quest-context-transformer';

type BuildWorkUnitForRoleInput =
  | { role: 'codeweaver'; step: DependencyStep; quest: Quest }
  | { role: 'siegemaster'; flow: Flow; quest: Quest; devServerUrl?: DevServerUrl }
  | { role: 'lawbringer'; step: DependencyStep }
  | { role: 'spiritmender'; step: DependencyStep };

export const buildWorkUnitForRoleTransformer = ({
  ...params
}: BuildWorkUnitForRoleInput): WorkUnit => {
  switch (params.role) {
    case 'codeweaver': {
      const { step, quest } = params;
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
      const { flow, quest, devServerUrl } = params;

      return workUnitContract.parse({
        role: 'siegemaster',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
        ...(devServerUrl === undefined ? {} : { devServerUrl }),
      });
    }

    case 'lawbringer': {
      const { step } = params;
      const filePaths = stepToFilePathsTransformer({ step });

      return workUnitContract.parse({
        role: 'lawbringer',
        filePaths,
      });
    }

    case 'spiritmender': {
      const { step } = params;
      const filePaths = stepToFilePathsTransformer({ step });

      return workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
      });
    }

    default: {
      const exhaustiveCheck: never = params;
      throw new Error(`Unknown role in input: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
