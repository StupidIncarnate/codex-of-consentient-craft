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

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const serverRouteCallSiteContract = z.object({
  method: contentTextContract,
  rawArg: contentTextContract,
  responderName: contentTextContract.nullable(),
});

export type ServerRouteCallSite = z.infer<typeof serverRouteCallSiteContract>;
