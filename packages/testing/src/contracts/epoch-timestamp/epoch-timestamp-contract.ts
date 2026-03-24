/**
 * PURPOSE: Branded number type for Unix epoch timestamps in milliseconds
 *
 * USAGE:
 * const ts = epochTimestampContract.parse(Date.now());
 * // Returns validated EpochTimestamp branded type
 */

import { z } from 'zod';

export const epochTimestampContract = z.number().nonnegative().brand<'EpochTimestamp'>();

export type EpochTimestamp = z.infer<typeof epochTimestampContract>;
