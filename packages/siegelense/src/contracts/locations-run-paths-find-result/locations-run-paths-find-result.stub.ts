/**
 * PURPOSE: Builds a valid LocationsRunPathsFindResult for tests
 *
 * USAGE:
 * LocationsRunPathsFindResultStub();
 * // Returns a valid LocationsRunPathsFindResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { locationsRunPathsFindResultContract } from './locations-run-paths-find-result-contract';
import type { LocationsRunPathsFindResult } from './locations-run-paths-find-result-contract';

export const LocationsRunPathsFindResultStub = ({
  ...props
}: StubArgument<LocationsRunPathsFindResult> = {}): LocationsRunPathsFindResult =>
  locationsRunPathsFindResultContract.parse({
    transcript: 'sample',
    storedReturn: 'sample',
    shotsDir: 'sample',
    ...props,
  });
