/**
 * PURPOSE: Builds a valid LocationsPruneAssetPathsFindResult for tests
 *
 * USAGE:
 * LocationsPruneAssetPathsFindResultStub();
 * // Returns a valid LocationsPruneAssetPathsFindResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { locationsPruneAssetPathsFindResultContract } from './locations-prune-asset-paths-find-result-contract';
import type { LocationsPruneAssetPathsFindResult } from './locations-prune-asset-paths-find-result-contract';

export const LocationsPruneAssetPathsFindResultStub = ({
  ...props
}: StubArgument<LocationsPruneAssetPathsFindResult> = {}): LocationsPruneAssetPathsFindResult =>
  locationsPruneAssetPathsFindResultContract.parse({
    runsDir: 'sample',
    videoDir: 'sample',
    logs: [],
    transcripts: [],
    ...props,
  });
