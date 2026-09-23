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
import {
  processCwdAdapter,
  pathJoinAdapter,
  fsExistsSyncAdapter,
} from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import { fsRealpathAdapter } from '../../../adapters/fs/realpath/fs-realpath-adapter';
import {
  repoLocalPathContract,
  type RepoLocalPath,
} from '../../../contracts/repo-local-path/repo-local-path-contract';

export const locationsRepoLinkPathFindBroker = async ({
  homePath,
}: {
  homePath: AbsoluteFilePath;
}): Promise<RepoLocalPath> => {
  const cwdPath = processCwdAdapter();
  const repoRoot = await cwdResolveBroker({ startPath: cwdPath, kind: 'repo-root' });

  const linkPath = pathJoinAdapter({
    paths: [
      repoRoot,
      locationsStatics.repoRoot.dungeonmasterAssets,
      locationsStatics.repoRoot.siegelenseLink,
    ],
  });

  const linkExists = fsExistsSyncAdapter({ filePath: linkPath });

  if (!linkExists) {
    return repoLocalPathContract.parse({ path: homePath, linkPresent: false });
  }

  const rootPath = locationsRootPathFindBroker();
  const resolvedTarget = await fsRealpathAdapter({ filePath: linkPath });

  if (resolvedTarget !== rootPath) {
    return repoLocalPathContract.parse({ path: homePath, linkPresent: false });
  }

  const repoLocalPath = absoluteFilePathContract.parse(homePath.replace(rootPath, linkPath));

  return repoLocalPathContract.parse({ path: repoLocalPath, linkPresent: true });
};
