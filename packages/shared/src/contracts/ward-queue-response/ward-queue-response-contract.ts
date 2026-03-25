/**
 * PURPOSE: Defines the shape for mock ward queue responses in integration tests
 *
 * USAGE:
 * const response: WardQueueResponse = { exitCode: ExitCodeStub(), runId: WardRunIdStub() };
 * // Used by orchestration integration tests to simulate ward command outputs
 */

import { z } from 'zod';

import { exitCodeContract } from '../exit-code/exit-code-contract';
import { timeoutMsContract } from '../timeout-ms/timeout-ms-contract';
import { wardRunIdContract } from '../ward-run-id/ward-run-id-contract';

export const wardQueueResponseContract = z.object({
  exitCode: exitCodeContract.optional(),
  runId: wardRunIdContract.optional(),
  wardResultJson: z.unknown().optional(),
  outputLines: z.array(z.string().brand<'WardOutputLine'>()).optional(),
  delayMs: timeoutMsContract.optional(),
});

export type WardQueueResponse = z.infer<typeof wardQueueResponseContract>;
