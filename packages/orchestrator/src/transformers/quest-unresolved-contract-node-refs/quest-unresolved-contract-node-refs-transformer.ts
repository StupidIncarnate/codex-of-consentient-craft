/**
 * PURPOSE: Returns descriptions of contracts whose nodeId does not resolve to any flow node
 *
 * USAGE:
 * questUnresolvedContractNodeRefsTransformer({contracts, flows});
 * // Returns ErrorMessage[] — e.g. ["contract 'LoginCredentials' has unresolved nodeId 'ghost'"].
 */
import type { Flow, QuestContractEntry } from '@dungeonmaster/shared/contracts';

export const questUnresolvedContractNodeRefsTransformer = ({
  contracts,
  flows,
}: {
  contracts?: QuestContractEntry[];
  flows?: Flow[];
}): string[] => {
  if (!contracts || contracts.length === 0) {
    return [];
  }

  const allNodeIds = new Set<unknown>();
  if (flows) {
    for (const flow of flows) {
      for (const node of flow.nodes) {
        allNodeIds.add(String(node.id));
      }
    }
  }

  const offenders: string[] = [];

  for (const contract of contracts) {
    const nodeId = String(contract.nodeId);
    if (!allNodeIds.has(nodeId)) {
      offenders.push(
        `contract '${String(contract.name)}' has unresolved nodeId '${nodeId}'`,
      );
    }
  }

  return offenders;
};
