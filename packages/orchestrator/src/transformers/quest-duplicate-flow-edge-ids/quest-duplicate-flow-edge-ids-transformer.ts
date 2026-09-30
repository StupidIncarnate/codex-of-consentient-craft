/**
 * PURPOSE: Returns descriptions of duplicated edge IDs within each flow (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateFlowEdgeIdsTransformer({flows});
 * // Returns ErrorMessage[] — one entry per flow that has duplicate edge ids, e.g. ["flow 'login': duplicate edges 'e1'"].
 */
import type { Flow } from '@dungeonmaster/shared/contracts';

export const questDuplicateFlowEdgeIdsTransformer = ({ flows }: { flows?: Flow[] }): string[] => {
  if (!flows) {
    return [];
  }

  const offenders: string[] = [];

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
      offenders.push(`flow '${String(flow.id)}': duplicate edges ${ids}`);
    }
  }

  return offenders;
};
