/**
 * PURPOSE: Defines the type for timer IDs returned by setTimeout
 *
 * USAGE:
 * const timerId: TimerId = setTimeout(() => {}, 1000);
 * // TimerId type matches Node.js/Browser timer return type
 */

import { z } from 'zod';

// TimerId is the return type of setTimeout - it's opaque and platform-dependent
// We use z.unknown() since we don't validate timer IDs, just pass them through
export const timerIdContract = z.unknown().brand<'TimerId'>();

export type TimerId = z.infer<typeof timerIdContract>;
