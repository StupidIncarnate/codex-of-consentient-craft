/**
 * PURPOSE: Resolves where one lane spec's measured profile lives, keyed by the spec's CONTENT hash
 * rather than its name. Adding a process to the spec changes the hash, so a profile measured against
 * the old content goes stale by construction — measurement restarts because the key changed, never
 * because someone remembered to invalidate it.
 *
 * USAGE:
 * locationsProfilesPathFindBroker({ specHash });
 * // Returns AbsoluteFilePath '<root>/profiles/<specHash>'
 */

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { SpecHash } from '../../../contracts/spec-hash/spec-hash-contract';

export const locationsProfilesPathFindBroker = ({
  specHash,
}: {
  specHash: SpecHash;
}): AbsoluteFilePath => {
  const rootPath = locationsRootPathFindBroker();

  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.siegelense.profilesDir, specHash],
  });

  return absoluteFilePathContract.parse(joined);
};
