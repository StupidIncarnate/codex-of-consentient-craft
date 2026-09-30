/**
 * PURPOSE: Defines the shape for mock ward queue responses in integration tests
 *
 * USAGE:
 * const response: WardQueueResponse = { exitCode: ExitCodeStub(), runId: WardRunIdStub() };
 * // Used by orchestration integration tests to simulate ward command outputs
 */

import { z } from '#gateway/npm/zod';


export const wardQueueResponseContract = z.object({
  exitCode: z.number().int().min(0).max(255).brand<'WardQueueResponseExitCode'>().optional(),
  runId: wardQueueResponseRunId.optional(),
  wardResultJson: z.json().optional(),
  outputLines: z.array(z.string().brand<'WardQueueResponseOutputLines'>()).optional(),
  delayMs: z.number().int().min(0).brand<'WardQueueResponseDelayMs'>().optional(),
}).brand<'WardQueueResponse'>();

export type WardQueueResponse = z.infer<typeof wardQueueResponseContract>;
