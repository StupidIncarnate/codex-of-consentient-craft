/**
 * PURPOSE: Defines the result structure from monitoring Claude stream-json output
 *
 * USAGE:
 * const result = streamMonitorResultContract.parse({ sessionId: '...', exitCode: 0, timedOut: false, signal: null });
 * // Returns validated StreamMonitorResult
 */

import { z } from 'zod';
import { exitCodeContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import { streamSignalContract } from '../stream-signal/stream-signal-contract';

export const streamMonitorResultContract = z.object({
  sessionId: sessionIdContract.nullable(),
  exitCode: exitCodeContract.nullable(),
  timedOut: z.boolean().brand<'TimedOutFlag'>(),
  signal: streamSignalContract.nullable(),
});

export type StreamMonitorResult = z.infer<typeof streamMonitorResultContract>;
