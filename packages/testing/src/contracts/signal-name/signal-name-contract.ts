/**
 * PURPOSE: Defines signal names for process termination (e.g., SIGTERM, SIGKILL)
 *
 * USAGE:
 * const signal = signalNameContract.parse('SIGTERM');
 * // Returns validated SignalName branded type
 */

import { z } from 'zod';

export const signalNameContract = z.string().brand<'SignalName'>();

export type SignalName = z.infer<typeof signalNameContract>;
