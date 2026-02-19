/**
 * PURPOSE: Validates that all flow requirementIds point to existing requirements in the quest
 *
 * USAGE:
 * questHasValidFlowRefsGuard({flows, requirements});
 * // Returns true if all flow requirementIds reference existing requirement IDs, false otherwise
 */
import type { FlowStub, RequirementStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type Requirement = ReturnType<typeof RequirementStub>;

export const questHasValidFlowRefsGuard = ({
  flows,
  requirements,
}: {
  flows?: Flow[];
  requirements?: Requirement[];
}): boolean => {
  if (!flows || !requirements) {
    return false;
  }

  if (flows.length === 0) {
    return true;
  }

  const requirementIds = new Set(requirements.map((req) => req.id));

  return flows.every((flow) =>
    flow.requirementIds.every((reqId) => requirementIds.has(reqId)),
  );
};
