/**
 * PURPOSE: Rewrites a `#gateway/<folder>/<sub>` import specifier into the real workspace package
 * specifier it names (`@dungeonmaster/<folder>/<sub>`, whatever scope the repo actually uses), by
 * finding the known package whose path sits directly under that gateway folder's own group
 * directory (`packages/@gateway/<folder>`). Every other specifier — a relative path, an ordinary
 * bare package name, or a `#`-prefixed specifier naming no recognized gateway folder or no known
 * package — passes through unchanged, so a caller can run every specifier through this before
 * matching or resolving it without needing to know in advance which form it is.
 *
 * USAGE:
 * gatewaySpecifierCanonicalizeTransformer({
 *   specifier: ModuleSpecifierStub({value: '#gateway/node/fs'}),
 *   knownPackages: [ProjectFolderStub({name: '@dungeonmaster/node', path: '/repo/packages/@gateway/node'})],
 * });
 * // Returns '@dungeonmaster/node/fs' as ModuleSpecifier
 */

import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';

export const gatewaySpecifierCanonicalizeTransformer = ({
  specifier,
  knownPackages,
}: {
  specifier: string;
  knownPackages: readonly ProjectFolder[];
}): string => {
  const prefix = `${gatewayLocationsStatics.importPrefix}/`;
  if (!specifier.startsWith(prefix)) {
    return specifier;
  }

  const rest = specifier.slice(prefix.length);
  const separatorIndex = rest.indexOf('/');
  const folder = separatorIndex === -1 ? rest : rest.slice(0, separatorIndex);
  const subpath = separatorIndex === -1 ? '' : rest.slice(separatorIndex);

  const matchedPackage = knownPackages.find((projectFolder) =>
    projectFolder.path.endsWith(`/@gateway/${folder}`),
  );
  if (matchedPackage === undefined) {
    return specifier;
  }

  return `${matchedPackage.name}${subpath}`;
};
