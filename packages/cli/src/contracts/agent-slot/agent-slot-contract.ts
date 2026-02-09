/**
 * PURPOSE: Provides agent-slot contract from orchestrator
 *
 * USAGE:
 * agentSlotContract.parse({stepId, sessionId, process, startedAt});
 * // Returns: AgentSlot object
 */

import {
  agentSlotContract as orcAgentSlotContract,
  type AgentSlot as OrcAgentSlot,
} from '@dungeonmaster/orchestrator';

export const agentSlotContract = orcAgentSlotContract;

export type AgentSlot = OrcAgentSlot;
