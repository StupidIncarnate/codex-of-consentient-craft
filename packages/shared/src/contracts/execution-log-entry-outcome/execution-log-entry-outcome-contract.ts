/**
 * PURPOSE: Defines the outcome of an execution log entry — whether the agent phase passed or failed
 *
 * USAGE:
 * executionLogEntryOutcomeContract.parse('pass');
 * // Returns: ExecutionLogEntryOutcome branded enum value
 */

import { z } from 'zod';

export const executionLogEntryOutcomeContract = z
  .enum(['pass', 'fail'])
  .brand<'ExecutionLogEntryOutcome'>();

export type ExecutionLogEntryOutcome = z.infer<typeof executionLogEntryOutcomeContract>;
