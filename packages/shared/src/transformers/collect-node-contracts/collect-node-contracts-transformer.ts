/**
 * PURPOSE: Filters quest contract entries to those anchored to a specific flow node
 *
 * USAGE:
 * collectNodeContractsTransformer({ nodeId: 'submit-form', contracts });
 * // Returns: QuestContractEntry[] where each entry's nodeId matches the given nodeId
 */

import type { QuestContractEntry } from '../../contracts/quest-contract-entry/quest-contract-entry-contract';
import type { FlowNode } from '../../contracts/flow-node/flow-node-contract';

export const collectNodeContractsTransformer = ({
  nodeId,
  contracts,
}: {
  nodeId: FlowNode['id'];
  contracts: readonly QuestContractEntry[];
}): QuestContractEntry[] => contracts.filter((contract) => contract.nodeId === nodeId);
