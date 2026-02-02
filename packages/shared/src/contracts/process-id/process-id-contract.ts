/**
 * PURPOSE: Defines a branded string type for orchestration process identifiers
 *
 * USAGE:
 * processIdContract.parse('proc-12345');
 * // Returns: ProcessId branded string
 */

import { z } from 'zod';

export const processIdContract = z.string().min(1).brand<'ProcessId'>();

export type ProcessId = z.infer<typeof processIdContract>;
