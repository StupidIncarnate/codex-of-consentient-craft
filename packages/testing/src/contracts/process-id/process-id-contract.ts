/**
 * PURPOSE: Defines the process ID type for spawned processes
 *
 * USAGE:
 * const pid = processIdContract.parse(12345);
 * // Returns validated ProcessId branded type
 */

import { z } from 'zod';

export const processIdContract = z.number().int().nonnegative().brand<'ProcessId'>();

export type ProcessId = z.infer<typeof processIdContract>;
