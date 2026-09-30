/**
 * PURPOSE: Builds a valid DiscoverPackagesLayerResult for tests
 *
 * USAGE:
 * DiscoverPackagesLayerResultStub();
 * // Returns a valid DiscoverPackagesLayerResult
 */

import { discoverPackagesLayerResultContract } from './discover-packages-layer-result-contract';
import type { DiscoverPackagesLayerResult } from './discover-packages-layer-result-contract';

export const DiscoverPackagesLayerResultStub = (): DiscoverPackagesLayerResult =>
  discoverPackagesLayerResultContract.parse([]);
