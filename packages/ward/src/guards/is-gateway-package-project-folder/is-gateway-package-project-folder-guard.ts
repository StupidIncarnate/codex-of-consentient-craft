/**
 * PURPOSE: Answers whether a known workspace package sits directly under the gateway's own group
 * directory (`packages/@gateway/<folder>`) — the one structural fact every gateway package shares,
 * whatever its own `package.json` `name` reads as. `targetPathFromBareSpecifierTransformer` uses
 * this to decide whether a matched package's subpaths live under `src/` — every gateway package's
 * `exports` maps every subpath's wildcard into a `src` folder holding an `index.ts`, unlike an
 * ordinary workspace package's root-level barrel files.
 *
 * USAGE:
 * isGatewayPackageProjectFolderGuard({
 *   projectFolder: ProjectFolderStub({path: '/repo/packages/@gateway/node'}),
 * });
 * // Returns true
 */

import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';

export const isGatewayPackageProjectFolderGuard = ({
  projectFolder,
}: {
  projectFolder?: ProjectFolder;
}): boolean => {
  if (!projectFolder) {
    return false;
  }

  return Object.values(gatewayLocationsStatics.folders).some((folder) =>
    projectFolder.path.endsWith(`/@gateway/${folder}`),
  );
};
