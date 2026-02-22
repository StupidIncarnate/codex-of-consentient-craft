/**
 * PURPOSE: Defines a branded non-negative number type for file modification timestamps in milliseconds
 *
 * USAGE:
 * mtimeMsContract.parse(1708473600000);
 * // Returns: MtimeMs branded number
 */

import { z } from 'zod';

export const mtimeMsContract = z.number().nonnegative().brand<'MtimeMs'>();

export type MtimeMs = z.infer<typeof mtimeMsContract>;
