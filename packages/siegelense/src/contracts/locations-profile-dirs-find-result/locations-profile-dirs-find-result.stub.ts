/**
 * PURPOSE: Builds a valid LocationsProfileDirsFindResult for tests
 *
 * USAGE:
 * LocationsProfileDirsFindResultStub();
 * // Returns a valid LocationsProfileDirsFindResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { locationsProfileDirsFindResultContract } from './locations-profile-dirs-find-result-contract';
import type { LocationsProfileDirsFindResult } from './locations-profile-dirs-find-result-contract';

export const LocationsProfileDirsFindResultStub = ({
  ...props
}: StubArgument<LocationsProfileDirsFindResult> = {}): LocationsProfileDirsFindResult =>
  locationsProfileDirsFindResultContract.parse({
    samplesDir: 'sample',
    bootsDir: 'sample',
    ...props,
  });
