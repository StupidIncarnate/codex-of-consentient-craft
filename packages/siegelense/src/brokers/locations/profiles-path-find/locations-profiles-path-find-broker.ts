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
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const locationsProfilesPathFindBroker = ({ specHash }: { specHash: string }): string => {
  const rootPath = locationsRootPathFindBroker();

  const joined = join(rootPath, locationsStatics.siegelense.profilesDir, specHash);

  return joined;
};
