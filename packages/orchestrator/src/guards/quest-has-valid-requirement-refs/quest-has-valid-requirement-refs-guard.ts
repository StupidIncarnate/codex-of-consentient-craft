/**
 * PURPOSE: Validates that every observable's requirementId (when present) references an existing requirement
 *
 * USAGE:
 * questHasValidRequirementRefsGuard({observables, requirements});
 * // Returns true if every observable's requirementId exists in requirements, false otherwise
 */
import type { ObservableStub, RequirementStub } from '@dungeonmaster/shared/contracts';

type Observable = ReturnType<typeof ObservableStub>;
type Requirement = ReturnType<typeof RequirementStub>;

export const questHasValidRequirementRefsGuard = ({
  observables,
  requirements,
}: {
  observables?: Observable[];
  requirements?: Requirement[];
}): boolean => {
  if (!observables || !requirements) {
    return false;
  }

  if (observables.length === 0) {
    return true;
  }

  const requirementIds = new Set(requirements.map((req) => req.id));

  return observables.every((obs) => {
    if (!obs.requirementId) {
      return true;
    }
    return requirementIds.has(obs.requirementId);
  });
};
