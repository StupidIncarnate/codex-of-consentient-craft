/**
 * PURPOSE: Defines a single HTTP fetch adapter call site extracted from a web broker file
 *
 * USAGE:
 * webFetchCallSiteContract.parse({ method: 'GET', rawArg: 'webConfigStatics.api.routes.quests' });
 * // Returns validated WebFetchCallSite
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';

export const webFetchCallSiteContract = z.object({
  method: contentTextContract,
  rawArg: contentTextContract,
});

export type WebFetchCallSite = z.infer<typeof webFetchCallSiteContract>;
