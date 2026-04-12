/**
 * PURPOSE: Validates that observable IDs are unique within each flow node (duplicates across nodes are allowed)
 *
 * USAGE:
 * questObservableIdsUniqueInNodeGuard({flows});
 * // Returns true if every node's observable IDs are unique within that node, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch duplicate observable IDs that would collide in a single node.
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questObservableIdsUniqueInNodeGuard = ({ flows }: { flows?: Flow[] }): boolean => {
  if (!flows) {
    return false;
  }

  return flows.every((flow) =>
    flow.nodes.every((node) => {
      const seen = new Set<unknown>();
      for (const observable of node.observables) {
        const id = String(observable.id);
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
      }
      return true;
    }),
  );
};
