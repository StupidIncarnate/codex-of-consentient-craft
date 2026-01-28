/**
 * PURPOSE: Defines the branded type for a signal context from needs-user-input signals
 *
 * USAGE:
 * const context: SignalContext = signalContextContract.parse('Gathering authentication requirements');
 * // Returns validated SignalContext branded string
 */

import { z } from 'zod';

export const signalContextContract = z.string().min(1).brand<'SignalContext'>();

export type SignalContext = z.infer<typeof signalContextContract>;
