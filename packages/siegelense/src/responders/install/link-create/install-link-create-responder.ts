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
 * Also clears the FLAT `<targetProjectRoot>/.siegelense` symlink a pre-nesting install left behind
 * (install-ignore-write-responder.ts repoints the same legacy name's `.gitignore` line) — a
 * consumer who re-runs `dungeonmaster init` after the nested path shipped would otherwise keep that
 * dead link forever, since nothing else on the install path ever revisits it. Checked with
 * fsReadlinkAdapter alone, never fsExistsSyncAdapter — existsSync FOLLOWS a symlink to its target,
 * so it would read a dangling legacy link as "missing" and a live one as indistinguishable from a
 * real directory. readlink instead answers three ways without ever following the link: it resolves
 * (the path IS a symlink — unlinked via fsUnlinkAdapter), it rejects EINVAL (readlink's own answer
 * for "this path exists and is not a symlink" — a real directory or file, left untouched), or it
 * rejects ENOENT (never there). Never fsRmAdapter or any recursive delete on this path — a real
 * directory or file here belongs to the consumer, not to this responder.
 *
 * USAGE:
 * const result = await InstallLinkCreateResponder({ context });
 * // Creates <targetProjectRoot>/.dungeonmaster-assets/siegelense-assets onto the resolved
 * // siegelense root, leaves an already-correct link untouched, or replaces one pointing
 * // somewhere else — and removes a legacy flat `.siegelense` symlink if one is still there
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
import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadlinkAdapter } from '../../../adapters/fs/readlink/fs-readlink-adapter';
import { fsSymlinkAdapter } from '../../../adapters/fs/symlink/fs-symlink-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';

const PACKAGE_NAME = '@dungeonmaster/siegelense';
const ASSETS_DIR_ENTRY = locationsStatics.repoRoot.dungeonmasterAssets;
const LINK_ENTRY = locationsStatics.repoRoot.siegelenseLink;
// The full path this responder reports in its messages — the CHILD, nested under the parent it
// never touches beyond `mkdir -p`ing it into existence.
const LINK_RELATIVE_PATH = `${ASSETS_DIR_ENTRY}/${LINK_ENTRY}`;
// The FLAT path a pre-nesting install left behind, directly at repo root rather than nested under
// `.dungeonmaster-assets/`. Not in locationsStatics — install-ignore-write-responder.ts holds this
// same legacy name as its own local literal for the identical reason: nothing the current install
// writes is named this, so nothing should ever resolve through a shared static for it either.
const LEGACY_LINK_ENTRY = '.siegelense';

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

  const legacyLinkPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [context.targetProjectRoot, LEGACY_LINK_ENTRY] }),
  );

  // '' means "nothing to report" (the legacy path is absent, the ordinary case) — the ENOENT branch
  // below leaves this initial value in place, so it is a genuine default, not a placeholder every
  // path overwrites. Appended as a plain template-literal suffix on whichever of the three messages
  // below applies, so there is no separate branch to decide whether to append it.
  let legacySuffix = '';

  try {
    await fsReadlinkAdapter({ linkPath: legacyLinkPath });
    await fsUnlinkAdapter({ filePath: legacyLinkPath });
    legacySuffix = `; removed legacy ${LEGACY_LINK_ENTRY} symlink`;
  } catch (legacyReadError) {
    // ENOENT (never there) and EINVAL (readlink's own answer for "this path exists and is not a
    // symlink") are the only two codes this classifies. EINVAL means a real directory or file
    // occupies the legacy path — reported, never touched, never unlinked. Anything else (EACCES,
    // ESTALE) is a real failure and propagates unchanged, matching fsStatAdapter's own ENOENT-only
    // absence contract.
    if (
      legacyReadError === null ||
      typeof legacyReadError !== 'object' ||
      !errorIsNativeErrorAdapter({ value: legacyReadError }) ||
      !('code' in legacyReadError)
    ) {
      throw legacyReadError;
    }

    if (legacyReadError.code === 'EINVAL') {
      legacySuffix = `; ${LEGACY_LINK_ENTRY} is a real directory or file; left untouched`;
    } else if (legacyReadError.code !== 'ENOENT') {
      throw legacyReadError;
    }
  }

  const linkExists = fsExistsSyncAdapter({ filePath: filePathContract.parse(linkPath) });

  if (!linkExists) {
    await fsSymlinkAdapter({ targetPath: targetDir, linkPath });

    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'created',
      message: installMessageContract.parse(
        `Created ${LINK_RELATIVE_PATH} -> ${targetDir}${legacySuffix}`,
      ),
    };
  }

  const currentTarget = await fsReadlinkAdapter({ linkPath });

  if (currentTarget === targetDir) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse(
        `${LINK_RELATIVE_PATH} already points at ${targetDir}${legacySuffix}`,
      ),
    };
  }

  await fsUnlinkAdapter({ filePath: linkPath });
  await fsSymlinkAdapter({ targetPath: targetDir, linkPath });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      `Replaced ${LINK_RELATIVE_PATH} to point at ${targetDir}${legacySuffix}`,
    ),
  };
};
