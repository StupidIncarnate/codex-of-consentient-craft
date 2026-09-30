/**
 * PURPOSE: Defines a single HTTP fetch adapter call site extracted from a web broker file
 *
 * USAGE:
 * webFetchCallSiteContract.parse({ method: 'GET', rawArg: 'webConfigStatics.api.routes.quests' });
 * // Returns validated WebFetchCallSite
 */

import { z } from '#gateway/npm/zod';

export const webFetchCallSiteContract = z.object({
  method: z.string().brand<'WebFetchCallSiteMethod'>(),
  rawArg: z.string().brand<'WebFetchCallSiteRawArg'>(),
}).brand<'WebFetchCallSite'>();

export type WebFetchCallSite = z.infer<typeof webFetchCallSiteContract>;
