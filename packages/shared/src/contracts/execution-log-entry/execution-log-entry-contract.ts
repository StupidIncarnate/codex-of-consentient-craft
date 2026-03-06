/**
 * PURPOSE: Defines the structure of an execution log entry for quest tracking
 *
 * USAGE:
 * executionLogEntryContract.parse({report: '001-report.json', timestamp: '2024-01-15T10:00:00.000Z'});
 * // Returns: ExecutionLogEntry object
 */

import { z } from 'zod';

import { stepIdContract } from '../step-id/step-id-contract';

export const executionLogEntryContract = z.object({
  report: z.string().brand<'ReportFilename'>(),
  stepId: stepIdContract.optional(),
  timestamp: z.string().datetime().brand<'IsoTimestamp'>(),
  agentType: z.string().brand<'AgentType'>().optional(),
  isRecovery: z.boolean().optional(),
});

export type ExecutionLogEntry = z.infer<typeof executionLogEntryContract>;
