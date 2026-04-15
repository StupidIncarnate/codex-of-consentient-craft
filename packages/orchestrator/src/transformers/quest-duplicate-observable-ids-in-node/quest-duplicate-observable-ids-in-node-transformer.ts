/**
 * PURPOSE: Returns descriptions of duplicated observable IDs within each flow node (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateObservableIdsInNodeTransformer({flows});
 * // Returns ErrorMessage[] — one per offending node, e.g. ["flow 'login' node 'n1': duplicate observables 'obs-a'"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questDuplicateObservableIdsInNodeTransformer = ({
  flows,
}: {
  flows?: Flow[];
}): ErrorMessage[] => {
  if (!flows) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    for (const node of flow.nodes) {
      const seen = new Set<unknown>();
      const duplicates = new Set<unknown>();

      for (const observable of node.observables) {
        const id = String(observable.id);
        if (seen.has(id)) {
          duplicates.add(id);
        } else {
          seen.add(id);
        }
      }

      if (duplicates.size > 0) {
        const ids = Array.from(duplicates)
          .map((id) => `'${String(id)}'`)
          .join(',');
        offenders.push(
          errorMessageContract.parse(
            `flow '${String(flow.id)}' node '${String(node.id)}': duplicate observables ${ids}`,
          ),
        );
      }
    }
  }

  return offenders;
};
