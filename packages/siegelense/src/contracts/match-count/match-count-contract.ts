/**
 * PURPOSE: How many elements one composed selector matched on the live page, as
 * `BrowserSession.countMatches` reports it. Reach for this over ReadingCount: a ReadingCount is a
 * run index's running tally over a buffer window, while a MatchCount is one strict-locator answer
 * about the page as it stands, and a step decides ambiguity from it.
 *
 * USAGE:
 * matchCountContract.parse(2);
 * // Returns a branded MatchCount
 */

import { z } from '#gateway/npm/zod';

export const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();

export type MatchCount = z.infer<typeof matchCountContract>;
