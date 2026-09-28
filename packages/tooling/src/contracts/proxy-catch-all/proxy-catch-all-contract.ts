/**
 * PURPOSE: A proxy file and every catch-all staging site in it. It ties a site to the proxy that
 * holds it, because a caller's migration edits that proxy, not the caller.
 *
 * USAGE:
 * proxyCatchAllContract.parse({ file: 'packages/a/src/x.proxy.ts', sites: [] });
 * // Returns: ProxyCatchAll
 */
import { z } from 'zod';
import { censusPathContract } from '../census-path/census-path-contract';
import { catchAllSiteContract } from '../catch-all-site/catch-all-site-contract';

export const proxyCatchAllContract = z.object({
  file: censusPathContract,
  sites: z.array(catchAllSiteContract),
});

export type ProxyCatchAll = z.infer<typeof proxyCatchAllContract>;
