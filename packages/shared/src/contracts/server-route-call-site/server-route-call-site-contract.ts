/**
 * PURPOSE: Defines a single HTTP route registration call site extracted from a server flow file,
 * including the responder identifier referenced inside the route handler body when present
 *
 * USAGE:
 * serverRouteCallSiteContract.parse({
 *   method: 'GET',
 *   rawArg: 'apiRoutesStatics.quests.list',
 *   responderName: 'QuestListResponder',
 * });
 * // Returns validated ServerRouteCallSite
 */

import { z } from '#gateway/npm/zod';

export const serverRouteCallSiteContract = z.object({
  method: z.string().brand<'ServerRouteCallSiteMethod'>(),
  rawArg: z.string().brand<'ServerRouteCallSiteRawArg'>(),
  responderName: z.string().brand<'ServerRouteCallSiteResponderName'>().nullable(),
}).brand<'ServerRouteCallSite'>();

export type ServerRouteCallSite = z.infer<typeof serverRouteCallSiteContract>;
