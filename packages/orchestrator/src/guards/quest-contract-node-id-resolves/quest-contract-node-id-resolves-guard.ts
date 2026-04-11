/**
 * PURPOSE: Validates that every contract entry's nodeId references an existing flow node across all flows
 *
 * USAGE:
 * questContractNodeIdResolvesGuard({contracts, flows});
 * // Returns true if every contract's nodeId points to an existing node, false if any is orphaned
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch contracts anchored to deleted or renamed nodes.
 */
import type { FlowStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

type Flow = ReturnType<typeof FlowStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questContractNodeIdResolvesGuard = ({
  contracts,
  flows,
}: {
  contracts?: QuestContractEntry[];
  flows?: Flow[];
}): boolean => {
  if (!contracts || !flows) {
    return false;
  }

  if (contracts.length === 0) {
    return true;
  }

  const allNodeIds = new Set<unknown>();
  for (const flow of flows) {
    for (const node of flow.nodes) {
      allNodeIds.add(String(node.id));
    }
  }

  return contracts.every((contract) => allNodeIds.has(String(contract.nodeId)));
};
