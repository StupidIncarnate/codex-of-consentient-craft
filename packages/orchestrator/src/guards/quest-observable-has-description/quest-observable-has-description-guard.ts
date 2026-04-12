/**
 * PURPOSE: Validates that every observable embedded in a flow node has a non-empty description
 *
 * USAGE:
 * questObservableHasDescriptionGuard({flows});
 * // Returns true if every observable has a non-empty description, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch placeholder observables with no description text.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questObservableHasDescriptionGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) =>
    flow.nodes.every((node) =>
      node.observables.every((observable) => {
        const { description } = observable;
        return typeof description === 'string' && description.length > 0;
      }),
    ),
  );
};
