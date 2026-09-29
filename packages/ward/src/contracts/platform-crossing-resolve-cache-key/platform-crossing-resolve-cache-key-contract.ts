/**
 * PURPOSE: One entry in `resolveSpecifierCachedLayerBroker`'s per-walk cache — the containing file
 * plus the specifier text it resolved, joined behind a NUL separator so neither half can be
 * mistaken for the other (a `FilePath` never legitimately contains one). Branded so the cache's
 * `Map` never carries a raw `string` key.
 *
 * USAGE:
 * platformCrossingResolveCacheKeyContract.parse('/repo/entry.ts\u0000./helper');
 * // Returns branded PlatformCrossingResolveCacheKey
 */

import { z } from '#gateway/npm/zod';

export const platformCrossingResolveCacheKeyContract = z
  .string()
  .min(1)
  .brand<'PlatformCrossingResolveCacheKey'>();

export type PlatformCrossingResolveCacheKey = z.infer<
  typeof platformCrossingResolveCacheKeyContract
>;
