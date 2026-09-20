/**
 * PURPOSE: Creates or repairs `<targetProjectRoot>/.siegelense`, the symlink onto the resolved
 * siegelense root that is the whole reason a siegelense evidence path resolves at all — a shot is
 * a PNG, the only way a model sees one is a `Read` of its path, and a path the reader's `Read`
 * cannot reach hands back nothing. The target comes from locationsRootPathFindBroker — the SAME
 * broker the runtime resolves siegelense's home through — never from context.dungeonmasterRoot,
 * which names the CLI package's own install location (see cli-entry.ts) and has no relation to
 * DUNGEONMASTER_HOME. Resolving through the shared broker keeps install time and runtime naming the
 * identical directory by construction, rather than by two call sites agreeing. `mkdir -p`s the
 * target BEFORE the link is touched, so the link is never dangling even for one step. Idempotent in
 * the sense that matters in practice: a link left over from another checkout still resolves to
 * something real, so this compares the link's STORED target (via fsReadlinkAdapter) rather than
 * trusting its mere presence, and only replaces it when that stored target is wrong.
 *
 * USAGE:
 * const result = await InstallLinkCreateResponder({ context });
 * // Creates <targetProjectRoot>/.siegelense onto the resolved siegelense root, leaves an
 * // already-correct link untouched, or replaces one pointing somewhere else
 */

import {
  fsMkdirAdapter,
  fsExistsSyncAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  filePathContract,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsRootPathFindBroker } from '../../../brokers/locations/root-path-find/locations-root-path-find-broker';
import { fsReadlinkAdapter } from '../../../adapters/fs/readlink/fs-readlink-adapter';
import { fsSymlinkAdapter } from '../../../adapters/fs/symlink/fs-symlink-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';

const PACKAGE_NAME = '@dungeonmaster/siegelense';
const LINK_ENTRY = locationsStatics.repoRoot.siegelenseLink;

export const InstallLinkCreateResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const targetDir = locationsRootPathFindBroker();
  const linkPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [context.targetProjectRoot, LINK_ENTRY] }),
  );

  await fsMkdirAdapter({ filepath: filePathContract.parse(targetDir) });

  const linkExists = fsExistsSyncAdapter({ filePath: filePathContract.parse(linkPath) });

  if (!linkExists) {
    await fsSymlinkAdapter({ targetPath: targetDir, linkPath });

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'created',
      message: installMessageContract.parse(`Created ${LINK_ENTRY} -> ${targetDir}`),
    };
  }

  const currentTarget = await fsReadlinkAdapter({ linkPath });

  if (currentTarget === targetDir) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse(`${LINK_ENTRY} already points at ${targetDir}`),
    };
  }

  await fsUnlinkAdapter({ filePath: linkPath });
  await fsSymlinkAdapter({ targetPath: targetDir, linkPath });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(`Replaced ${LINK_ENTRY} to point at ${targetDir}`),
  };
};
