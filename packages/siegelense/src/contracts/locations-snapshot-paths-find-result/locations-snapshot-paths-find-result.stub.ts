/**
 * PURPOSE: Builds a valid LocationsSnapshotPathsFindResult for tests
 *
 * USAGE:
 * LocationsSnapshotPathsFindResultStub();
 * // Returns a valid LocationsSnapshotPathsFindResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { locationsSnapshotPathsFindResultContract } from './locations-snapshot-paths-find-result-contract';
import type { LocationsSnapshotPathsFindResult } from './locations-snapshot-paths-find-result-contract';

export const LocationsSnapshotPathsFindResultStub = ({
  ...props
}: StubArgument<LocationsSnapshotPathsFindResult> = {}): LocationsSnapshotPathsFindResult =>
  locationsSnapshotPathsFindResultContract.parse({
    storeDir: 'sample',
    index: 'sample',
    payload: 'sample',
    ...props,
  });
