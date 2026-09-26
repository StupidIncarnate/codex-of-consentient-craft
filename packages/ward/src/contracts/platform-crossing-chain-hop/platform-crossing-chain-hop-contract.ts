/**
 * PURPOSE: One hop's display label in a platform-crossing violation's chain — the literal specifier
 * that carried the walk across that hop. Standalone so `walkGatewayCrossingsLayerBroker` can type
 * its own `chainLabels`/return arrays with the same brand `platformCrossingViolationContract.chain`
 * expects, without importing the whole violation contract just for this one field.
 *
 * USAGE:
 * platformCrossingChainHopContract.parse('@dungeonmaster/node/fs');
 * // Returns branded PlatformCrossingChainHop
 */

import { z } from 'zod';

export const platformCrossingChainHopContract = z
  .string()
  .min(1)
  .brand<'PlatformCrossingChainHop'>();

export type PlatformCrossingChainHop = z.infer<typeof platformCrossingChainHopContract>;
