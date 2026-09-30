/**
 * PURPOSE: Builds a valid AssetsAgeLayerResult for tests
 *
 * USAGE:
 * AssetsAgeLayerResultStub();
 * // Returns a valid AssetsAgeLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { assetsAgeLayerResultContract } from './assets-age-layer-result-contract';
import type { AssetsAgeLayerResult } from './assets-age-layer-result-contract';

export const AssetsAgeLayerResultStub = ({
  ...props
}: StubArgument<AssetsAgeLayerResult> = {}): AssetsAgeLayerResult =>
  assetsAgeLayerResultContract.parse({
    instances: 0,
    freedMB: 0,
    refusals: [],
    gaps: [],
    ...props,
  });
