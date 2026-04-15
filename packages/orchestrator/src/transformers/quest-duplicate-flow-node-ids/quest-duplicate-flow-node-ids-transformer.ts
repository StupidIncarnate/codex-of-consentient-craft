/**
 * PURPOSE: Returns descriptions of duplicated node IDs within each flow (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateFlowNodeIdsTransformer({flows});
 * // Returns ErrorMessage[] — one entry per flow that has duplicate node ids, e.g. ["flow 'login': duplicate nodes 'x','y'"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questDuplicateFlowNodeIdsTransformer = ({
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

    for (const node of flow.nodes) {
      const id = String(node.id);
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
        errorMessageContract.parse(`flow '${String(flow.id)}': duplicate nodes ${ids}`),
      );
    }
  }

  return offenders;
};
