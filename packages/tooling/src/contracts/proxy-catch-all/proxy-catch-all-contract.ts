/**
 * PURPOSE: A proxy file and every catch-all staging site in it. It ties a site to the proxy that
 * holds it, because a caller's migration edits that proxy, not the caller.
 *
 * USAGE:
 * proxyCatchAllContract.parse({ file: 'packages/a/src/x.proxy.ts', sites: [] });
 * // Returns: ProxyCatchAll
 */
import { z } from '#gateway/npm/zod';
import { catchAllSiteContract } from '../catch-all-site/catch-all-site-contract';

export const proxyCatchAllContract = z.object({
  file: z.string().min(1).brand<'ProxyCatchAllFile'>(),
  sites: z.array(catchAllSiteContract),
});

export type ProxyCatchAll = z.infer<typeof proxyCatchAllContract>;
