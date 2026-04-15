/**
 * PURPOSE: Returns descriptions of duplicated edge IDs within each flow (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateFlowEdgeIdsTransformer({flows});
 * // Returns ErrorMessage[] — one entry per flow that has duplicate edge ids, e.g. ["flow 'login': duplicate edges 'e1'"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questDuplicateFlowEdgeIdsTransformer = ({
  flows,
}: {
  flows?: Flow[];
}): ErrorMessage[] => {
  if (!flows) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const flow of flows) {
    const seen = new Set<unknown>();
    const duplicates = new Set<unknown>();

    for (const edge of flow.edges) {
      const id = String(edge.id);
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
        errorMessageContract.parse(`flow '${String(flow.id)}': duplicate edges ${ids}`),
      );
    }
  }

  return offenders;
};
