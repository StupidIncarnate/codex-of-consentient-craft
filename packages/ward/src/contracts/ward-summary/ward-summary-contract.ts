/**
 * PURPOSE: Defines a branded string for compact ward run summary output
 *
 * USAGE:
 * wardSummaryContract.parse('run: 1739625600000-a3f1\nlint: PASS 10 packages');
 * // Returns: WardSummary branded string
 */

import { z } from 'zod';

export const wardSummaryContract = z.string().brand<'WardSummary'>();

export type WardSummary = z.infer<typeof wardSummaryContract>;
