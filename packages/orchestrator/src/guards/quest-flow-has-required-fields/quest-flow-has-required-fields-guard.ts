/**
 * PURPOSE: Validates that every flow has the required fields — id, name, flowType, entryPoint, and at least one exitPoint
 *
 * USAGE:
 * questFlowHasRequiredFieldsGuard({flows});
 * // Returns true if every flow has all required fields including at least one exit point, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to ensure flows are structurally complete before step generation.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

const flowTypeValues = new Set(['runtime', 'operational']);

export const questFlowHasRequiredFieldsGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  if (flows.length === 0) {
    return true;
  }

  return flows.every((flow) => {
    if (!flow.id || String(flow.id).length === 0) {
      return false;
    }
    if (!flow.name || String(flow.name).length === 0) {
      return false;
    }
    if (!flowTypeValues.has(flow.flowType)) {
      return false;
    }
    if (!flow.entryPoint || String(flow.entryPoint).length === 0) {
      return false;
    }
    if (!Array.isArray(flow.exitPoints) || flow.exitPoints.length === 0) {
      return false;
    }
    return true;
  });
};
