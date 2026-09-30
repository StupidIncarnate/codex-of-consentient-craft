/**
 * PURPOSE: Builds a valid LocationsBufferPathsFindResult for tests
 *
 * USAGE:
 * LocationsBufferPathsFindResultStub();
 * // Returns a valid LocationsBufferPathsFindResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { locationsBufferPathsFindResultContract } from './locations-buffer-paths-find-result-contract';
import type { LocationsBufferPathsFindResult } from './locations-buffer-paths-find-result-contract';

export const LocationsBufferPathsFindResultStub = ({
  ...props
}: StubArgument<LocationsBufferPathsFindResult> = {}): LocationsBufferPathsFindResult =>
  locationsBufferPathsFindResultContract.parse({
    console: 'sample',
    network: 'sample',
    websocket: 'sample',
    ...props,
  });
