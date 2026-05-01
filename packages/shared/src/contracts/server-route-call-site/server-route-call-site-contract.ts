/**
 * PURPOSE: Defines a single HTTP route registration call site extracted from a server flow file
 *
 * USAGE:
 * serverRouteCallSiteContract.parse({ method: 'GET', rawArg: 'apiRoutesStatics.quests.list' });
 * // Returns validated ServerRouteCallSite
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const serverRouteCallSiteContract = z.object({
  method: contentTextContract,
  rawArg: contentTextContract,
});

export type ServerRouteCallSite = z.infer<typeof serverRouteCallSiteContract>;
