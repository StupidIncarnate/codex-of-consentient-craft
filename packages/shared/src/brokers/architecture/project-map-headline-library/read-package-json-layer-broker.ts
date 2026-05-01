/**
 * PURPOSE: Reads and parses a package's package.json, extracting the exports field
 * subpath keys as barrel names (e.g. './contracts' → 'contracts').
 *
 * USAGE:
 * const barrelNames = readPackageJsonLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/shared'),
 * });
 * // Returns ContentText[] — e.g. ['contracts', 'guards', 'statics']
 * // Returns [] if package.json is missing or exports field is absent
 *
 * WHEN-TO-USE: Library headline renderer reading barrel subpath keys from package.json
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { projectMapHeadlineLibraryStatics } from '../../../statics/project-map-headline-library/project-map-headline-library-statics';

export const readPackageJsonLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText[] => {
  const pkgJsonPath = absoluteFilePathContract.parse(`${String(packageRoot)}/package.json`);

  try {
    const raw = fsReadFileSyncAdapter({ filePath: pkgJsonPath });
    const parsed: unknown = JSON.parse(String(raw));

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return [];
    }

    const exportsField = (parsed as Record<PropertyKey, unknown>).exports;
    if (typeof exportsField !== 'object' || exportsField === null || Array.isArray(exportsField)) {
      return [];
    }

    const barrelNames: ContentText[] = [];
    for (const key of Object.keys(exportsField)) {
      // Strip leading './' from subpath export keys (e.g. './contracts' → 'contracts')
      const barrel = key.startsWith('./')
        ? key.slice(projectMapHeadlineLibraryStatics.subpathPrefixLength)
        : key;
      if (barrel !== '') {
        barrelNames.push(contentTextContract.parse(barrel));
      }
    }
    return barrelNames;
  } catch {
    return [];
  }
};
