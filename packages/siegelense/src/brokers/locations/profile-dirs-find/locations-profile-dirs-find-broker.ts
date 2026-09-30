/**
 * PURPOSE: Resolves the two directories one spec's measured profile is filed under — `samples/`, the
 * memory record each instance's own driver writes, and `boots/`, the boot time the client half of
 * `start` writes. Reach for this over `locationsProfilesPathFindBroker`: that one answers where the
 * spec's profile lives, this one answers where each HALF of it lives, and the split exists because
 * two different OS processes write the two halves and neither may read-modify-write the other's file.
 *
 * USAGE:
 * locationsProfileDirsFindBroker({ specHash });
 * // Returns { samplesDir: '<root>/profiles/<specHash>/samples',
 * //           bootsDir:   '<root>/profiles/<specHash>/boots' }
 */

import { locationsProfileDirsFindResultContract } from '../../../contracts/locations-profile-dirs-find-result/locations-profile-dirs-find-result-contract';
import type { LocationsProfileDirsFindResult } from '../../../contracts/locations-profile-dirs-find-result/locations-profile-dirs-find-result-contract';
import { join } from '#gateway/node/path';

import { profileStatics } from '../../../statics/profile/profile-statics';
import { locationsProfilesPathFindBroker } from '../profiles-path-find/locations-profiles-path-find-broker';

export const locationsProfileDirsFindBroker = ({
  specHash,
}: {
  specHash: string;
}): LocationsProfileDirsFindResult => {
  const profilePath = locationsProfilesPathFindBroker({ specHash });

  const samplesDir = join(profilePath, profileStatics.dirs.samples);
  const bootsDir = join(profilePath, profileStatics.dirs.boots);

  return locationsProfileDirsFindResultContract.parse({
    samplesDir,
    bootsDir,
  });
};
