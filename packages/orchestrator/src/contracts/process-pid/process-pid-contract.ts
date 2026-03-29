/**
 * PURPOSE: Defines a branded number type for OS process PIDs
 *
 * USAGE:
 * processPidContract.parse(12345);
 * // Returns: ProcessPid branded number
 */

import { z } from 'zod';

export const processPidContract = z.number().int().positive().brand<'ProcessPid'>();

export type ProcessPid = z.infer<typeof processPidContract>;
