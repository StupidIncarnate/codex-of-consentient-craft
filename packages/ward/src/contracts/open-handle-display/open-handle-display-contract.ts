/**
 * PURPOSE: One open handle already rendered for the summary — package, message and frames, with the
 * repo prefix stripped. Reach for this rather than the raw `OpenHandle` when COUNTING: one leak in a
 * shared helper reports once per call, and two reports are the same leak exactly when their
 * rendered lines match.
 *
 * USAGE:
 * openHandleDisplayContract.parse('  ward  setInterval still armed\n      at pollBroker (a.ts:1:1)');
 * // Returns a branded OpenHandleDisplay
 */

import { z } from 'zod';

export const openHandleDisplayContract = z.string().brand<'OpenHandleDisplay'>();

export type OpenHandleDisplay = z.infer<typeof openHandleDisplayContract>;
