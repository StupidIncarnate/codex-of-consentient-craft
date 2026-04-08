/**
 * PURPOSE: Filters quest contract entries to those not anchored to any flow node
 *
 * USAGE:
 * collectUnlinkedContractsTransformer({ contracts });
 * // Returns: QuestContractEntry[] where each entry has no nodeId
 */

import type { QuestContractEntry } from '../../contracts/quest-contract-entry/quest-contract-entry-contract';

export const collectUnlinkedContractsTransformer = ({
  contracts,
}: {
  contracts: readonly QuestContractEntry[];
}): QuestContractEntry[] => contracts.filter((contract) => contract.nodeId === undefined);
