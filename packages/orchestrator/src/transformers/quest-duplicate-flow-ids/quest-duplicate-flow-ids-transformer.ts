/**
 * PURPOSE: Returns the list of duplicated flow IDs in a quest (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateFlowIdsTransformer({flows});
 * // Returns ErrorMessage[] — each entry is a duplicated flow id, e.g. ["login-flow"].
 */
import type { FlowStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;

export const questDuplicateFlowIdsTransformer = ({ flows }: { flows?: Flow[] }): ErrorMessage[] => {
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

  return Array.from(duplicates).map((id) => errorMessageContract.parse(String(id)));
};
