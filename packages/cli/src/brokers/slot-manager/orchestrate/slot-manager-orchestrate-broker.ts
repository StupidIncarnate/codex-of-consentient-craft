/**
 * PURPOSE: Orchestrates N concurrent agent slots to execute quest steps in parallel
 *
 * USAGE:
 * const result = await slotManagerOrchestrateBroker({questFilePath, slotCount, timeoutMs, slotOperations, role});
 * // Returns { completed: true } when all steps done, or { completed: false, userInputNeeded } when blocked
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../../contracts/agent-role/agent-role-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotManagerResult } from '../../../contracts/slot-manager-result/slot-manager-result-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { TimeoutMs } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { runOrchestrationLayerBroker } from './run-orchestration-layer-broker';

export const slotManagerOrchestrateBroker = async ({
  questFilePath,
  slotCount,
  timeoutMs,
  slotOperations,
  role,
}: {
  questFilePath: FilePath;
  slotCount: SlotCount;
  timeoutMs: TimeoutMs;
  slotOperations: SlotOperations;
  role: AgentRole;
}): Promise<SlotManagerResult> =>
  runOrchestrationLayerBroker({
    questFilePath,
    slotCount,
    timeoutMs,
    slotOperations,
    role,
    activeAgents: [],
  });
