/**
 * PURPOSE: One place in a proxy that stages or reads back without naming a specific call, so a
 * migration knows which tests passed only because that proxy answers everything.
 *
 * USAGE:
 * catchAllSiteContract.parse({ line: 12, kind: 'empty-address', snippet: 'handle.calledWith([])' });
 * // Returns: CatchAllSite (1-based line, the kind of catch-all, the call's text)
 */
import { z } from '#gateway/npm/zod';

export const catchAllSiteContract = z
  .object({
    line: z.number().int().positive().brand<'CatchAllSiteLine'>(),
    kind: z.enum(['empty-address', 'accept-all-predicate', 'read-all']),
    snippet: z.string().brand<'CatchAllSiteSnippet'>(),
  })
  .brand<'CatchAllSite'>();

export type CatchAllSite = z.infer<typeof catchAllSiteContract>;
