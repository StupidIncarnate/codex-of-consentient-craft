/**
 * PURPOSE: One entry in `walkGatewayCrossingsMemoizedLayerBroker`'s per-walk cache — the target
 * file plus its normalized requested-names set, joined behind a NUL separator so neither half can
 * be mistaken for the other. Branded so the cache's `Map` never carries a raw `string` key.
 *
 * USAGE:
 * platformCrossingWalkMemoKeyContract.parse('/repo/shared.ts\u0000all');
 * // Returns branded PlatformCrossingWalkMemoKey
 */

import { z } from '#gateway/npm/zod';

export const platformCrossingWalkMemoKeyContract = z
  .string()
  .min(1)
  .brand<'PlatformCrossingWalkMemoKey'>();

export type PlatformCrossingWalkMemoKey = z.infer<typeof platformCrossingWalkMemoKeyContract>;
