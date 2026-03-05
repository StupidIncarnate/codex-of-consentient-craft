/**
 * PURPOSE: Validates that every terminal node in every flow has at least one observable
 *
 * USAGE:
 * questHasNodeCoverageGuard({flows});
 * // Returns true if all terminal nodes have observables, false otherwise
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questHasNodeCoverageGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  if (flows.length === 0) {
    return true;
  }

  return flows.every((flow) =>
    flow.nodes
      .filter((node) => node.type === 'terminal')
      .every((node) => node.observables.length > 0),
  );
};
