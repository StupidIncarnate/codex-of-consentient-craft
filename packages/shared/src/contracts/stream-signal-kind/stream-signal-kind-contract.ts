/**
 * PURPOSE: The discrete kind of signal an agent emits via signal-back — complete is the sole session-terminal marker
 *
 * USAGE:
 * streamSignalKindContract.parse('complete');
 * // Returns: 'complete' as StreamSignalKind
 *
 * The outcome of the session rides ON the signal-back call as operationStatus ('done' | 'partial'),
 * not as a distinct signal kind. There is no failure signal — agents fix their own problems and
 * pivot in place; the only failure concept is a ward exit-code red, handled by the orchestrator.
 */

import { z } from 'zod';

export const streamSignalKindContract = z.enum(['complete']);

export type StreamSignalKind = z.infer<typeof streamSignalKindContract>;
