/**
 * PURPOSE: Creates or repairs `<targetProjectRoot>/.dungeonmaster-assets/siegelense-assets`, the
 * symlink onto the resolved siegelense root that is the whole reason a siegelense evidence path
 * resolves at all — a shot is a PNG, the only way a model sees one is a `Read` of its path, and a
 * path the reader's `Read` cannot reach hands back nothing. The target comes from
 * locationsRootPathFindBroker — the SAME broker the runtime resolves siegelense's home through —
 * never from context.dungeonmasterRoot, which names the CLI package's own install location (see
 * cli-entry.ts) and has no relation to DUNGEONMASTER_HOME. Resolving through the shared broker keeps
 * install time and runtime naming the identical directory by construction, rather than by two call
 * sites agreeing. `mkdir -p`s BOTH the link's target (the siegelense root it points to) AND its own
 * PARENT (`.dungeonmaster-assets`, which the link lives nested inside rather than directly at repo
 * root) BEFORE the link is touched, so the link is never dangling even for one step and the parent
 * exists even on a repo where no dungeonmaster asset has ever been written before. `.dungeonmaster-
 * assets` itself is never created empty-then-abandoned or removed — a committed oddities file lives
 * directly inside it — this responder only ever touches the `siegelense-assets` child it owns.
 * Idempotent in the sense that matters in practice: a link left over from another checkout still
 * resolves to something real, so this compares the link's STORED target (via fsReadlinkAdapter)
 * rather than trusting its mere presence, and only replaces it when that stored target is wrong.
 *
 * USAGE:
 * const result = await InstallLinkCreateResponder({ context });
 * // Creates <targetProjectRoot>/.dungeonmaster-assets/siegelense-assets onto the resolved
 * // siegelense root, leaves an already-correct link untouched, or replaces one pointing
 * // somewhere else
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
const ASSETS_DIR_ENTRY = locationsStatics.repoRoot.dungeonmasterAssets;
const LINK_ENTRY = locationsStatics.repoRoot.siegelenseLink;
// The full path this responder reports in its messages — the CHILD, nested under the parent it
// never touches beyond `mkdir -p`ing it into existence.
const LINK_RELATIVE_PATH = `${ASSETS_DIR_ENTRY}/${LINK_ENTRY}`;

export const InstallLinkCreateResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const targetDir = locationsRootPathFindBroker();
  const assetsDir = pathJoinAdapter({ paths: [context.targetProjectRoot, ASSETS_DIR_ENTRY] });
  const linkPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [assetsDir, LINK_ENTRY] }),
  );

  await fsMkdirAdapter({ filepath: filePathContract.parse(targetDir) });
  await fsMkdirAdapter({ filepath: assetsDir });

  const linkExists = fsExistsSyncAdapter({ filePath: filePathContract.parse(linkPath) });

  if (!linkExists) {
    await fsSymlinkAdapter({ targetPath: targetDir, linkPath });

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'created',
      message: installMessageContract.parse(`Created ${LINK_RELATIVE_PATH} -> ${targetDir}`),
    };
  }

  const currentTarget = await fsReadlinkAdapter({ linkPath });

  if (currentTarget === targetDir) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse(`${LINK_RELATIVE_PATH} already points at ${targetDir}`),
    };
  }

  await fsUnlinkAdapter({ filePath: linkPath });
  await fsSymlinkAdapter({ targetPath: targetDir, linkPath });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      `Replaced ${LINK_RELATIVE_PATH} to point at ${targetDir}`,
    ),
  };
};
