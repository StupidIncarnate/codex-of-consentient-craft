/**
 * PURPOSE: The discrete kind of signal an agent emits via signal-back — complete, failed, or failed-replan
 *
 * USAGE:
 * streamSignalKindContract.parse('complete');
 * // Returns: 'complete' as StreamSignalKind
 */

import { z } from 'zod';

export const streamSignalKindContract = z.enum(['complete', 'failed', 'failed-replan']);

export type StreamSignalKind = z.infer<typeof streamSignalKindContract>;
