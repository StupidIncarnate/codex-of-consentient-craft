/**
 * PURPOSE: Defines the branded type for agent type identifiers in execution logs
 *
 * USAGE:
 * agentTypeContract.parse('ward');
 * // Returns: AgentType branded string
 */

import { z } from 'zod';

export const agentTypeContract = z.string().min(1).brand<'AgentType'>();

export type AgentType = z.infer<typeof agentTypeContract>;
