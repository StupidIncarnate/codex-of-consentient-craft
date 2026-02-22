/**
 * PURPOSE: Defines a branded string type for a session display summary extracted from JSONL files
 *
 * USAGE:
 * sessionSummaryContract.parse('Built login page with OAuth');
 * // Returns: SessionSummary branded string
 */

import { z } from 'zod';

export const sessionSummaryContract = z.string().brand<'SessionSummary'>();

export type SessionSummary = z.infer<typeof sessionSummaryContract>;
