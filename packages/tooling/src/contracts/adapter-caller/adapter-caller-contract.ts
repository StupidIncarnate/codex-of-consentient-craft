/**
 * PURPOSE: One production file that imports an adapter, with the proxy chain a migration of that
 * adapter has to edit with it: the caller's own proxy, every proxy that composes that proxy, and
 * which of them stage a catch-all. That set has to go to one agent.
 *
 * USAGE:
 * adapterCallerContract.parse({ file: 'packages/a/src/x.ts', proxyFile: null, composedBy: [], catchAll: [] });
 * // Returns: AdapterCaller
 */
import { z } from '#gateway/npm/zod';
import { proxyCatchAllContract } from '../proxy-catch-all/proxy-catch-all-contract';

export const adapterCallerContract = z.object({
  file: z.string().min(1).brand<'AdapterCallerFile'>(),
  proxyFile: z.string().min(1).brand<'AdapterCallerProxyFile'>().nullable(),
  composedBy: z.array(z.string().min(1).brand<'AdapterCallerComposedBy'>()),
  catchAll: z.array(proxyCatchAllContract),
}).brand<'AdapterCaller'>();

export type AdapterCaller = z.infer<typeof adapterCallerContract>;
