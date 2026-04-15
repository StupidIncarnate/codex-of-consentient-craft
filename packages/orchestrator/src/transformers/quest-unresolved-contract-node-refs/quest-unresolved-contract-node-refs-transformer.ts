/**
 * PURPOSE: Returns descriptions of contracts whose nodeId does not resolve to any flow node
 *
 * USAGE:
 * questUnresolvedContractNodeRefsTransformer({contracts, flows});
 * // Returns ErrorMessage[] — e.g. ["contract 'LoginCredentials' has unresolved nodeId 'ghost'"].
 */
import type { FlowStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questUnresolvedContractNodeRefsTransformer = ({
  contracts,
  flows,
}: {
  contracts?: QuestContractEntry[];
  flows?: Flow[];
}): ErrorMessage[] => {
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

  const offenders: ErrorMessage[] = [];

  for (const contract of contracts) {
    const nodeId = String(contract.nodeId);
    if (!allNodeIds.has(nodeId)) {
      offenders.push(
        errorMessageContract.parse(
          `contract '${String(contract.name)}' has unresolved nodeId '${nodeId}'`,
        ),
      );
    }
  }

  return offenders;
};
