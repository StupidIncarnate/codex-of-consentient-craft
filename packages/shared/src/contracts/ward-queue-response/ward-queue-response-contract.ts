/**
 * PURPOSE: Defines the shape for mock ward queue responses in integration tests
 *
 * USAGE:
 * const response: WardQueueResponse = { exitCode: ExitCodeStub(), runId: WardRunIdStub() };
 * // Used by orchestration integration tests to simulate ward command outputs
 */

import { z } from '#gateway/npm/zod';

import { exitCodeContract } from '../exit-code/exit-code-contract';

export const wardQueueResponseContract = z.object({
  exitCode: exitCodeContract.optional(),
  runId: wardQueueResponseRunId.optional(),
  wardResultJson: z.unknown().optional(),
  outputLines: z.array(z.string().brand<'WardOutputLine'>()).optional(),
  delayMs: z.number().int().min(0).brand<'WardQueueResponseDelayMs'>().optional(),
});

export type WardQueueResponse = z.infer<typeof wardQueueResponseContract>;
