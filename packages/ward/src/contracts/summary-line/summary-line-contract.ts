/**
 * PURPOSE: Branded type for a single meaningful summary line extracted from an error message
 *
 * USAGE:
 * summaryLineContract.parse('Expected true to be false');
 * // Returns: 'Expected true to be false' as SummaryLine
 */

import { z } from 'zod';

export const summaryLineContract = z.string().min(1).brand<'SummaryLine'>();

export type SummaryLine = z.infer<typeof summaryLineContract>;
