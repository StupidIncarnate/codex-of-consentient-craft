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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { SpecHash } from '../../../contracts/spec-hash/spec-hash-contract';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { locationsProfilesPathFindBroker } from '../profiles-path-find/locations-profiles-path-find-broker';

export const locationsProfileDirsFindBroker = ({
  specHash,
}: {
  specHash: SpecHash;
}): {
  samplesDir: AbsoluteFilePath;
  bootsDir: AbsoluteFilePath;
} => {
  const profilePath = locationsProfilesPathFindBroker({ specHash });

  const samplesDir = pathJoinAdapter({ paths: [profilePath, profileStatics.dirs.samples] });
  const bootsDir = pathJoinAdapter({ paths: [profilePath, profileStatics.dirs.boots] });

  return {
    samplesDir: absoluteFilePathContract.parse(samplesDir),
    bootsDir: absoluteFilePathContract.parse(bootsDir),
  };
};
