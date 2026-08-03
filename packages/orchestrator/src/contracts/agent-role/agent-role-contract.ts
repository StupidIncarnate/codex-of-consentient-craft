/**
 * PURPOSE: Defines valid agent role values for orchestration
 *
 * USAGE:
 * agentRoleContract.parse('codeweaver');
 * // Returns: 'codeweaver' as AgentRole
 */

import { z } from 'zod';

import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';

export const agentRoleContract = z.enum(agentPromptClassificationStatics.roleNames);

export type AgentRole = z.infer<typeof agentRoleContract>;
