/**
 * PURPOSE: Defines a branded ISO timestamp string type
 *
 * USAGE:
 * const timestamp: IsoTimestamp = isoTimestampContract.parse('2024-01-15T10:00:00.000Z');
 * // Returns a branded IsoTimestamp string
 */

import { z } from 'zod';

export const isoTimestampContract = z.string().datetime().brand<'IsoTimestamp'>();

export type IsoTimestamp = z.infer<typeof isoTimestampContract>;
