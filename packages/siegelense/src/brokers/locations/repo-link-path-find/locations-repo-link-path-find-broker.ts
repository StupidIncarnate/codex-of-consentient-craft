/**
 * PURPOSE: Turns an absolute path under the siegelense home into the form a `Read` can actually
 * reach — `<repoRoot>/.dungeonmaster-assets/siegelense-assets/…` through the symlink
 * `dungeonmaster init` writes onto `<home>/.dungeonmaster/siegelense/` — because a shot is a PNG and
 * the only way a model sees one is a `Read` of its path. Answers `linkPresent: false` with the real
 * home path whenever the link cannot be trusted to reach the right tree: absent (`init` never ran
 * here), or present but pointing at a DIFFERENT siegelense root — a link left over from another
 * checkout, the case likeliest to be missed since the link still resolves to something real.
 *
 * USAGE:
 * await locationsRepoLinkPathFindBroker({ homePath });
 * // Returns RepoLocalPath — { path: '<repoRoot>/.dungeonmaster-assets/siegelense-assets/...', linkPresent: true }
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { cwd } from '#gateway/node/process';
import { join } from '#gateway/node/path';
import { existsSync } from '#gateway/node/fs';
import { realpath } from '#gateway/node/fs__promises';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import {
  repoLocalPathContract,
  type RepoLocalPath,
} from '../../../contracts/repo-local-path/repo-local-path-contract';

export const locationsRepoLinkPathFindBroker = async ({
  homePath,
}: {
  homePath: string;
}): Promise<RepoLocalPath> => {
  const cwdPath = cwd();
  const repoRoot = await cwdResolveBroker({ startPath: cwdPath, kind: 'repo-root' });

  const linkPath = join(
    repoRoot,
    locationsStatics.repoRoot.dungeonmasterAssets,
    locationsStatics.repoRoot.siegelenseLink,
  );

  const linkExists = existsSync(linkPath);

  if (!linkExists) {
    return repoLocalPathContract.parse({ path: homePath, linkPresent: false });
  }

  const rootPath = locationsRootPathFindBroker();
  const resolvedTarget = await realpath(linkPath);

  if (resolvedTarget !== rootPath) {
    return repoLocalPathContract.parse({ path: homePath, linkPresent: false });
  }

  const repoLocalPath = homePath.replace(rootPath, linkPath);

  return repoLocalPathContract.parse({ path: repoLocalPath, linkPresent: true });
};
