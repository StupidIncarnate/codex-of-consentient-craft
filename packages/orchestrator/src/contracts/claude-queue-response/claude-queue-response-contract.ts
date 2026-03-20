/**
 * PURPOSE: Defines the shape for mock Claude CLI queue responses in integration tests
 *
 * USAGE:
 * const response: ClaudeQueueResponse = { sessionId, lines: [...], exitCode: ExitCodeStub() };
 * // Used by orchestration integration tests to simulate Claude agent outputs
 */

import { z } from 'zod';

import { exitCodeContract } from '@dungeonmaster/shared/contracts';
import { sessionIdContract } from '@dungeonmaster/shared/contracts';

import { streamJsonLineContract } from '../stream-json-line/stream-json-line-contract';
import { timeoutMsContract } from '../timeout-ms/timeout-ms-contract';

export const claudeQueueResponseContract = z.object({
  sessionId: sessionIdContract,
  lines: z.array(streamJsonLineContract),
  exitCode: exitCodeContract.optional(),
  delayMs: timeoutMsContract.optional(),
});

export type ClaudeQueueResponse = z.infer<typeof claudeQueueResponseContract>;
