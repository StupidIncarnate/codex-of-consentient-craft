/**
 * PURPOSE: Defines the summary structure for an agent type's execution log entries
 *
 * USAGE:
 * const summary: ExecutionLogAgentSummary = {lastEntry: entry, failCount: failCountContract.parse(0)};
 * // Type-safe summary of agent execution log entries
 */

import { z } from 'zod';

import { executionLogEntryContract } from '@dungeonmaster/shared/contracts';

import { failCountContract } from '../fail-count/fail-count-contract';

export const executionLogAgentSummaryContract = z.object({
  lastEntry: executionLogEntryContract.optional(),
  failCount: failCountContract,
});

export type ExecutionLogAgentSummary = z.infer<typeof executionLogAgentSummaryContract>;
