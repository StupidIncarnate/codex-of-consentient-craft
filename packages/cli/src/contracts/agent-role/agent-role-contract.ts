/**
 * PURPOSE: Provides agent-role contract from orchestrator
 *
 * USAGE:
 * agentRoleContract.parse('pathseeker');
 * // Returns: AgentRole
 */

import {
  agentRoleContract as orcAgentRoleContract,
  type AgentRole as OrcAgentRole,
} from '@dungeonmaster/orchestrator';

export const agentRoleContract = orcAgentRoleContract;

export type AgentRole = OrcAgentRole;
