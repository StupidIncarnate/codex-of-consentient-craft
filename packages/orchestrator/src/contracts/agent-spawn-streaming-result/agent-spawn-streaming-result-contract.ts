/**
 * PURPOSE: Defines the result structure from spawning Claude with streaming and monitoring output
 *
 * USAGE:
 * const result = agentSpawnStreamingResultContract.parse({ sessionId: '...', exitCode: 0, signal: null, crashed: false, timedOut: false });
 * // Returns validated AgentSpawnStreamingResult
 */

import { z } from 'zod';
import { exitCodeContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import { streamSignalContract } from '../stream-signal/stream-signal-contract';
import { streamTextContract } from '../stream-text/stream-text-contract';

export const agentSpawnStreamingResultContract = z.object({
  sessionId: sessionIdContract.nullable(),
  exitCode: exitCodeContract.nullable(),
  signal: streamSignalContract.nullable(),
  crashed: z.boolean().brand<'CrashedFlag'>(),
  timedOut: z.boolean().brand<'TimedOutFlag'>(),
  capturedOutput: z.array(streamTextContract).default([]),
});

export type AgentSpawnStreamingResult = z.infer<typeof agentSpawnStreamingResultContract>;
