/**
 * PURPOSE: Defines the result structure from spawning ChaosWhisperer with streaming output and signal extraction
 *
 * USAGE:
 * const result: ChaoswhispererStreamingResult = chaoswhispererStreamingResultContract.parse({
 *   sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
 *   signal: { signal: 'complete', stepId: '...', summary: '...' },
 *   exitCode: 0
 * });
 * // Returns validated ChaoswhispererStreamingResult
 */

import { z } from 'zod';
import { sessionIdContract, exitCodeContract } from '@dungeonmaster/shared/contracts';
import { streamSignalContract } from '../stream-signal/stream-signal-contract';

export const chaoswhispererStreamingResultContract = z.object({
  sessionId: sessionIdContract.nullable(),
  signal: streamSignalContract.nullable(),
  exitCode: exitCodeContract.nullable(),
});

export type ChaoswhispererStreamingResult = z.infer<typeof chaoswhispererStreamingResultContract>;
