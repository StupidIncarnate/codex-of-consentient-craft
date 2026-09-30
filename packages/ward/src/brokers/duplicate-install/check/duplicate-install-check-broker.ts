/**
 * PURPOSE: The duplicate-install check's entry point. Reads every `packages/@gateway/*` package's
 * own third-party `dependencies`/`peerDependencies`, then probes the repo root and every workspace
 * package's top-level `node_modules` for a second copy of the same name — the shape that broke
 * `MantineProvider` lookup in `web` this session (`packages/@gateway/npm/node_modules/@mantine/core`
 * at 8.3.18 while `packages/web/node_modules/@mantine/core` sat at 8.3.14), because a caller reaching
 * a package through the gateway then gets a different module instance than one importing it
 * directly. A candidate name that is itself a workspace package (resolved through the workspace
 * symlink, never installed twice) is skipped, matching how npm itself would never duplicate it.
 *
 * USAGE:
 * await duplicateInstallCheckBroker({rootPath: filePathContract.parse('/repo')});
 * // Returns: readonly DuplicateInstallViolation[] — empty when every candidate resolves to one copy
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import {
  duplicateInstallViolationContract,
  type DuplicateInstallViolation,
} from '../../../contracts/duplicate-install-violation/duplicate-install-violation-contract';
import {
  duplicateInstallLocationContract,
  type DuplicateInstallLocation,
} from '../../../contracts/duplicate-install-location/duplicate-install-location-contract';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { isGatewayPackageProjectFolderGuard } from '../../../guards/is-gateway-package-project-folder/is-gateway-package-project-folder-guard';
import { duplicateInstallThresholdsStatics } from '../../../statics/duplicate-install-thresholds/duplicate-install-thresholds-statics';
import { gatewayDependencyNamesReadLayerBroker } from './gateway-dependency-names-read-layer-broker';
import { installedPackageVersionReadOptionalLayerBroker } from './installed-package-version-read-optional-layer-broker';

export const duplicateInstallCheckBroker = async ({
  rootPath,
}: {
  rootPath: string;
}): Promise<readonly DuplicateInstallViolation[]> => {
  const rootAbsolute = absoluteFilePathContract.parse(rootPath);
  const rootAbsoluteString = String(rootAbsolute);
  const folders = (await workspaceDiscoverBroker({ rootPath: rootAbsolute })) ?? [];

  const gatewayFolders = folders.filter((folder) =>
    isGatewayPackageProjectFolderGuard({ projectFolder: folder }),
  );
  if (gatewayFolders.length === 0) {
    return [];
  }

  const candidateNames = await gatewayDependencyNamesReadLayerBroker({ gatewayFolders });
  const workspacePackageNames = new Set(folders.map((folder) => String(folder.name)));
  const namesToCheck = candidateNames.filter((name) => !workspacePackageNames.has(String(name)));

  const locationDirs = [rootAbsoluteString, ...folders.map((folder) => String(folder.path))];
  const rootPrefix = `${rootAbsoluteString}/`;

  const violations = await Promise.all(
    namesToCheck.map(async (name): Promise<DuplicateInstallViolation | undefined> => {
      const foundLocations = await Promise.all(
        locationDirs.map(async (dir): Promise<DuplicateInstallLocation | undefined> => {
          const packageJsonPath = `${dir}/node_modules/${name}/package.json`;
          const version = await installedPackageVersionReadOptionalLayerBroker({
            packageJsonPath,
          });
          if (version === undefined) {
            return undefined;
          }

          const relativeDir = dir === rootAbsoluteString ? '' : dir.slice(rootPrefix.length);
          const location =
            relativeDir === '' ? `node_modules/${name}` : `${relativeDir}/node_modules/${name}`;

          return duplicateInstallLocationContract.parse({ location, version });
        }),
      );

      const locations = foundLocations.filter((found) => found !== undefined);
      if (
        locations.length < duplicateInstallThresholdsStatics.counts.minimumLocationsForViolation
      ) {
        return undefined;
      }

      return duplicateInstallViolationContract.parse({ packageName: name, locations });
    }),
  );

  return violations.filter((violation) => violation !== undefined);
};
