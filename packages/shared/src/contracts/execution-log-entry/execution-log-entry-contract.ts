/**
 * PURPOSE: Defines the structure of an execution log entry for quest tracking
 *
 * USAGE:
 * executionLogEntryContract.parse({report: '001-report.json', timestamp: '2024-01-15T10:00:00.000Z'});
 * // Returns: ExecutionLogEntry object
 */

import { z } from 'zod';

import { agentTypeContract } from '../agent-type/agent-type-contract';
import { executionLogEntryOutcomeContract } from '../execution-log-entry-outcome/execution-log-entry-outcome-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { stepIdContract } from '../step-id/step-id-contract';

export const executionLogEntryContract = z.object({
  report: z.string().brand<'ReportFilename'>(),
  stepId: stepIdContract.optional(),
  timestamp: z.string().datetime().brand<'IsoTimestamp'>(),
  agentType: agentTypeContract.optional(),
  isRecovery: z.boolean().optional(),
  status: z.enum(['start', 'pass', 'fail']).optional(),
  outcome: executionLogEntryOutcomeContract.optional(),
  failedObservableIds: z.array(observableIdContract).default([]),
});

export type ExecutionLogEntry = z.infer<typeof executionLogEntryContract>;
