/**
 * PURPOSE: Validates that every approved requirement is referenced by at least one flow
 *
 * USAGE:
 * questHasFlowCoverageGuard({flows, requirements});
 * // Returns true if every requirement with status 'approved' is covered by at least one flow's requirementIds
 */
import type { FlowStub, RequirementStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type Requirement = ReturnType<typeof RequirementStub>;

export const questHasFlowCoverageGuard = ({
  flows,
  requirements,
}: {
  flows?: Flow[];
  requirements?: Requirement[];
}): boolean => {
  if (!flows || !requirements) {
    return false;
  }

  const approvedRequirements = requirements.filter((req) => req.status === 'approved');

  if (approvedRequirements.length === 0) {
    return true;
  }

  const coveredIds = new Set(flows.flatMap((flow) => flow.requirementIds));

  return approvedRequirements.every((req) => coveredIds.has(req.id));
};
