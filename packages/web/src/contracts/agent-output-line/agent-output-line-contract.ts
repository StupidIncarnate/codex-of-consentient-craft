/**
 * PURPOSE: Defines a branded string type for a single line of agent stdout output
 *
 * USAGE:
 * agentOutputLineContract.parse('Building auth guard...');
 * // Returns: AgentOutputLine branded string
 */

import { z } from 'zod';

export const agentOutputLineContract = z.string().brand<'AgentOutputLine'>();

export type AgentOutputLine = z.infer<typeof agentOutputLineContract>;
