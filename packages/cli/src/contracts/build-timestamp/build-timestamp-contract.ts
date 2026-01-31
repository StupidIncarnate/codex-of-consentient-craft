/**
 * PURPOSE: Defines a branded build timestamp string type for display purposes
 *
 * USAGE:
 * const timestamp: BuildTimestamp = buildTimestampContract.parse('Jan 30 2:45 PM');
 * // Returns a branded BuildTimestamp string
 */

import { z } from 'zod';

export const buildTimestampContract = z.string().min(1).brand<'BuildTimestamp'>();

export type BuildTimestamp = z.infer<typeof buildTimestampContract>;
