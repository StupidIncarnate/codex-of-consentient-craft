/**
 * PURPOSE: Defines the shape for mock ward queue responses in integration tests
 *
 * USAGE:
 * const response: WardQueueResponse = { exitCode: ExitCodeStub(), runId: WardRunIdStub() };
 * // Used by orchestration integration tests to simulate ward command outputs
 */

import { z } from 'zod';

import { exitCodeContract } from '@dungeonmaster/shared/contracts';

import { wardRunIdContract } from '../ward-run-id/ward-run-id-contract';

export const wardQueueResponseContract = z.object({
  exitCode: exitCodeContract.optional(),
  runId: wardRunIdContract.optional(),
  wardResultJson: z.unknown().optional(),
});

export type WardQueueResponse = z.infer<typeof wardQueueResponseContract>;
