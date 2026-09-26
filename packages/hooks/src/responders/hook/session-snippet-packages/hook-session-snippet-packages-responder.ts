/**
 * PURPOSE: Lists every directory under `packages/` for the session-start packages snippet. Reach
 * for this rather than the project map when the caller needs the names that EXIST — the map
 * renders no section for a `library` package, so a name list scraped from its headers silently
 * omits them.
 *
 * USAGE:
 * const content = HookSessionSnippetPackagesResponder();
 * // Returns ContentText: "## Packages\n\n- **cli**\n- **config**"
 *
 * WHEN-TO-USE: When the session-snippet hook needs dynamic packages content at runtime
 */

import { absoluteFilePathContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { fsReaddirWithTypesAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, ContentText, PackageName } from '@dungeonmaster/shared/contracts';

const SINGLE_ROOT_FALLBACK_PACKAGE_NAME = 'root';

// A directory directly under `packages/` whose name starts with `@` is a scope/group folder, not
// a package itself — mirrors `node_modules/@scope/name` — so its own children are listed here
// instead, never the group.
const GROUP_FOLDER_PREFIX = '@';

export const HookSessionSnippetPackagesResponder = ({
  projectRoot = absoluteFilePathContract.parse(processCwdAdapter()),
}: {
  projectRoot?: AbsoluteFilePath;
} = {}): ContentText => {
  const packagesDir = absoluteFilePathContract.parse(`${String(projectRoot)}/packages`);

  let packages: PackageName[] = [packageNameContract.parse(SINGLE_ROOT_FALLBACK_PACKAGE_NAME)];
  try {
    const topLevelEntries = fsReaddirWithTypesAdapter({ dirPath: packagesDir }).filter((entry) =>
      entry.isDirectory(),
    );

    const groupChildNames = topLevelEntries
      .filter((entry) => entry.name.startsWith(GROUP_FOLDER_PREFIX))
      .flatMap((group) =>
        fsReaddirWithTypesAdapter({
          dirPath: absoluteFilePathContract.parse(`${String(packagesDir)}/${group.name}`),
        })
          .filter((child) => child.isDirectory())
          .map((child) => child.name),
      );

    const names = topLevelEntries
      .filter((entry) => !entry.name.startsWith(GROUP_FOLDER_PREFIX))
      .map((entry) => entry.name)
      .concat(groupChildNames);

    // readdir order is filesystem-dependent, so sort here or the snippet reshuffles between machines.
    const dirs = names
      .map((name) => packageNameContract.parse(name))
      .sort((a, b) => String(a).localeCompare(String(b)));
    if (dirs.length > 0) {
      packages = dirs;
    }
  } catch {
    // Single-root mode (no packages/ directory): keep the fallback initialization above.
  }

  const bullets = packages.map((name) => `- **${String(name)}**`).join('\n');

  return contentTextContract.parse(`## Packages\n\n${bullets}`);
};
