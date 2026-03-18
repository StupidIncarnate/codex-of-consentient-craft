/**
 * PURPOSE: Defines a branded string type for ward run identifiers
 *
 * USAGE:
 * wardRunIdContract.parse('1773805659495-6b06');
 * // Returns: WardRunId branded string
 */

import { z } from 'zod';

export const wardRunIdContract = z.string().min(1).brand<'WardRunId'>();

export type WardRunId = z.infer<typeof wardRunIdContract>;
