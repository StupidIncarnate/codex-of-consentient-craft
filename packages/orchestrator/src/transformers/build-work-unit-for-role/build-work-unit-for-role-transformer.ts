/**
 * PURPOSE: Builds a WorkUnit for the given role from a dependency step
 *
 * USAGE:
 * const workUnit = buildWorkUnitForRoleTransformer({ role: 'codeweaver', step });
 * // Returns CodeweaverWorkUnit { role: 'codeweaver', step }
 */

import type { DependencyStep } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';
import { workUnitContract } from '../../contracts/work-unit/work-unit-contract';

export const buildWorkUnitForRoleTransformer = ({
  role,
  step,
}: {
  role: AgentRole;
  step: DependencyStep;
}): WorkUnit => {
  switch (role) {
    case 'codeweaver': {
      return workUnitContract.parse({
        role: 'codeweaver',
        step,
      });
    }

    case 'pathseeker':
    case 'spiritmender':
    case 'lawbringer':
    case 'siegemaster': {
      // For now, these roles are not directly spawned from step context
      // They require additional data that isn't available in the step
      throw new Error(
        `Role "${role}" cannot be built from step alone - requires additional context`,
      );
    }

    default: {
      const exhaustiveCheck: never = role;
      throw new Error(`Unknown role: ${String(exhaustiveCheck)}`);
    }
  }
};
