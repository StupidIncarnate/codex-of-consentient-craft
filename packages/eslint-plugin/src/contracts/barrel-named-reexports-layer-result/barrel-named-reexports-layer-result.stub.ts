/**
 * PURPOSE: Builds a valid BarrelNamedReexportsLayerResult for tests
 *
 * USAGE:
 * BarrelNamedReexportsLayerResultStub();
 * // Returns a valid BarrelNamedReexportsLayerResult
 */

import { barrelNamedReexportsLayerResultContract } from './barrel-named-reexports-layer-result-contract';
import type { BarrelNamedReexportsLayerResult } from './barrel-named-reexports-layer-result-contract';

export const BarrelNamedReexportsLayerResultStub = (): BarrelNamedReexportsLayerResult =>
  barrelNamedReexportsLayerResultContract.parse([]);
