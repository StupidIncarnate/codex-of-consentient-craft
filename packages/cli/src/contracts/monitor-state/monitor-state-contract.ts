/**
 * PURPOSE: Defines the internal state structure for stream monitoring
 *
 * USAGE:
 * const state: MonitorState = { sessionId: null, signal: null, timedOut: false, timerId: null };
 * // Tracks state during stream monitoring
 */

import { z } from 'zod';
import { sessionIdContract } from '@dungeonmaster/shared/contracts';
import { streamSignalContract } from '../stream-signal/stream-signal-contract';
import { timerIdContract } from '../timer-id/timer-id-contract';
import { timedOutFlagContract } from '../timed-out-flag/timed-out-flag-contract';

export const monitorStateContract = z.object({
  sessionId: sessionIdContract.nullable(),
  signal: streamSignalContract.nullable(),
  timedOut: timedOutFlagContract,
  timerId: timerIdContract.nullable(),
});

export type MonitorState = z.infer<typeof monitorStateContract>;
