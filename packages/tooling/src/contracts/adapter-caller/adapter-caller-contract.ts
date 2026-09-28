/**
 * PURPOSE: One production file that imports an adapter, with the proxy chain a migration of that
 * adapter has to edit with it: the caller's own proxy, every proxy that composes that proxy, and
 * which of them stage a catch-all. That set has to go to one agent.
 *
 * USAGE:
 * adapterCallerContract.parse({ file: 'packages/a/src/x.ts', proxyFile: null, composedBy: [], catchAll: [] });
 * // Returns: AdapterCaller
 */
import { z } from 'zod';
import { censusPathContract } from '../census-path/census-path-contract';
import { proxyCatchAllContract } from '../proxy-catch-all/proxy-catch-all-contract';

export const adapterCallerContract = z.object({
  file: censusPathContract,
  proxyFile: censusPathContract.nullable(),
  composedBy: z.array(censusPathContract),
  catchAll: z.array(proxyCatchAllContract),
});

export type AdapterCaller = z.infer<typeof adapterCallerContract>;
