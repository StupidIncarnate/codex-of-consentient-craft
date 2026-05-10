/**
 * PURPOSE: Defines valid agent names for the get-agent-prompt MCP tool
 *
 * USAGE:
 * agentPromptNameContract.parse('chaoswhisperer-gap-minion');
 * // Returns: 'chaoswhisperer-gap-minion' as AgentPromptName
 */

import { z } from 'zod';

export const agentPromptNameContract = z.enum([
  'chaoswhisperer-gap-minion',
  'pathseeker-surface-scope-minion',
  'pathseeker-contract-dedup-minion',
  'pathseeker-assertion-correctness-minion',
  'blightwarden-security-minion',
  'blightwarden-dedup-minion',
  'blightwarden-perf-minion',
  'blightwarden-integrity-minion',
  'blightwarden-dead-code-minion',
]);

export type AgentPromptName = z.infer<typeof agentPromptNameContract>;
