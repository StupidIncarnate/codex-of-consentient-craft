/**
 * PURPOSE: Filters quest contract entries to those anchored to a specific flow node
 *
 * USAGE:
 * collectNodeContractsTransformer({ nodeId: flowNodeIdContract.parse('submit-form'), contracts });
 * // Returns: QuestContractEntry[] where each entry's nodeId matches the given nodeId
 */

import type { FlowNodeId } from '../../contracts/flow-node-id/flow-node-id-contract';
import type { QuestContractEntry } from '../../contracts/quest-contract-entry/quest-contract-entry-contract';

export const collectNodeContractsTransformer = ({
  nodeId,
  contracts,
}: {
  nodeId: FlowNodeId;
  contracts: readonly QuestContractEntry[];
}): QuestContractEntry[] => contracts.filter((contract) => contract.nodeId === nodeId);
