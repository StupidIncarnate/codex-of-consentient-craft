/**
 * PURPOSE: Defines a branded string type for agent identifiers that correlate JSONL entries to their originating sub-agent
 *
 * USAGE:
 * agentIdContract.parse('agent-abc');
 * // Returns branded AgentId
 */

import { z } from 'zod';

export const agentIdContract = z.string().min(1).brand<'AgentId'>();

export type AgentId = z.infer<typeof agentIdContract>;
