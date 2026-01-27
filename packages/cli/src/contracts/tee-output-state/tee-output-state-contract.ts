/**
 * PURPOSE: Defines the internal state structure for tee output monitoring
 *
 * USAGE:
 * const state: TeeOutputState = { sessionId: null, signal: null };
 * // Used internally by tee-output-layer-broker to track extracted data
 */

import { z } from 'zod';
import { sessionIdContract } from '@dungeonmaster/shared/contracts';
import { streamSignalContract } from '../stream-signal/stream-signal-contract';

export const teeOutputStateContract = z.object({
  sessionId: sessionIdContract.nullable(),
  signal: streamSignalContract.nullable(),
});

export type TeeOutputState = z.infer<typeof teeOutputStateContract>;
