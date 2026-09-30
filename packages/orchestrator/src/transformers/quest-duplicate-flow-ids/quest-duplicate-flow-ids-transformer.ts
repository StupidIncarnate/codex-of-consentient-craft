/**
 * PURPOSE: Returns the list of duplicated flow IDs in a quest (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateFlowIdsTransformer({flows});
 * // Returns ErrorMessage[] — each entry is a duplicated flow id, e.g. ["login-flow"].
 */
import type { Flow } from '@dungeonmaster/shared/contracts';

export const questDuplicateFlowIdsTransformer = ({ flows }: { flows?: Flow[] }): string[] => {
  if (!flows) {
    return [];
  }

  const seen = new Set<unknown>();
  const duplicates = new Set<unknown>();

  for (const flow of flows) {
    const id = String(flow.id);
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }

  return Array.from(duplicates).map((id) => String(id));
};
