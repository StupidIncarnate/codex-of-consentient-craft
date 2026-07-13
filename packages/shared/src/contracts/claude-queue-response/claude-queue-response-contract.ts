/**
 * PURPOSE: Defines the shape for mock Claude CLI queue responses in integration tests
 *
 * USAGE:
 * const response: ClaudeQueueResponse = { sessionId, lines: [...], exitCode: ExitCodeStub() };
 * // Used by orchestration integration tests to simulate Claude agent outputs
 */

import { z } from 'zod';

import { exitCodeContract } from '../exit-code/exit-code-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { streamJsonLineContract } from '../stream-json-line/stream-json-line-contract';
import { timeoutMsContract } from '../timeout-ms/timeout-ms-contract';

export const claudeQueueResponseContract = z.object({
  sessionId: sessionIdContract,
  lines: z.array(streamJsonLineContract),
  exitCode: exitCodeContract.optional(),
  delayMs: timeoutMsContract.optional(),
  // E2E dispatch-loop driver: when present, the fake Claude CLI parses questId/workItemId from the
  // `-p` task prompt and POSTs the env-gated /api/quests/:questId/signal-back endpoint (awaited)
  // BEFORE it writes its JSONL + exits, so the operations relay advances before the child exit the
  // Node dispatcher awaits (an in_progress work item seen at scan is treated as orphaned).
  signalBack: z
    .object({
      operationStatus: z.enum(['done', 'partial']),
    })
    .optional(),
  // E2E restart driver: when true, the fake Claude CLI emits its lines (so sessionId stamps from the
  // init line) then blocks forever without exiting or signalling — the dispatch loop stays parked on
  // that child until the process is killed (server restart / pause).
  hang: z.boolean().optional(),
});

export type ClaudeQueueResponse = z.infer<typeof claudeQueueResponseContract>;
