/**
 * PURPOSE: Compose the project-map slice for a caller-supplied list of packages: per-package
 * connection-graph view (boot, type-specific headline, side-channel) plus a pointer to the
 * per-package detail tool. Empty `packages` and unknown names throw.
 *
 * USAGE:
 * const markdown = await architectureProjectMapBroker({
 *   projectRoot: absoluteFilePathContract.parse('/home/user/project'),
 *   packages: [packageNameContract.parse('mcp'), packageNameContract.parse('shared')],
 * });
 * // Returns ContentText markdown with symbol legend, per-package sections, and pointer footer
 *
 * WHEN-TO-USE: When a caller knows which packages they need a connection-graph for
 */

import { architecturePackageTypeDetectBroker } from '../package-type-detect/architecture-package-type-detect-broker';
import { packageSectionBuildLayerBroker } from './package-section-build-layer-broker';
import { pointerFooterRenderLayerBroker } from './pointer-footer-render-layer-broker';
import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { PackageName } from '../../../contracts/package-name/package-name-contract';

export const architectureProjectMapBroker = async ({
  projectRoot,
  packages,
}: {
  projectRoot: AbsoluteFilePath;
  packages: PackageName[];
}): Promise<ContentText> => {
  if (packages.length === 0) {
    throw new Error('get-project-map requires at least one package name in `packages`.');
  }

  const packagesPath = absoluteFilePathContract.parse(
    `${projectRoot}/${projectMapStatics.packagesDirName}`,
  );
  const packagesEntries = discoverPackagesLayerBroker({ dirPath: packagesPath });
  const packageDirs = packagesEntries.filter((entry) => entry.isDirectory());

  const scanTargets: {
    packageName: ContentText;
    packageRoot: AbsoluteFilePath;
  }[] = [];

  if (packageDirs.length > 0) {
    const sortedPackages = [...packageDirs].sort((a, b) => a.name.localeCompare(b.name));

    for (const pkg of sortedPackages) {
      const pkgRoot = absoluteFilePathContract.parse(
        `${projectRoot}/${projectMapStatics.packagesDirName}/${pkg.name}`,
      );
      scanTargets.push({
        packageName: contentTextContract.parse(pkg.name),
        packageRoot: pkgRoot,
      });
    }
  } else {
    scanTargets.push({
      packageName: contentTextContract.parse(projectMapStatics.rootPackageName),
      packageRoot: projectRoot,
    });
  }

  const discoveredNames = scanTargets.map(({ packageName }) => String(packageName));
  const requestedNames = packages.map((name) => String(name));
  const unknown = requestedNames.filter((name) => !discoveredNames.includes(name));
  if (unknown.length > 0) {
    const validList = [...discoveredNames].sort((a, b) => a.localeCompare(b)).join(', ');
    throw new Error(`Unknown package(s): ${unknown.join(', ')}. Valid: ${validList}`);
  }

  const targetsWithType = await Promise.all(
    scanTargets.map(async ({ packageName, packageRoot }) => ({
      packageName,
      packageRoot,
      packageType: await architecturePackageTypeDetectBroker({ packageRoot }),
    })),
  );

  // Library packages have no startup tree to walk — they belong to get-project-inventory.
  const renderableTargets = targetsWithType
    .filter(({ packageType }) => packageType !== 'library')
    .filter(({ packageName }) => requestedNames.includes(String(packageName)));

  const packageSections = renderableTargets.map(({ packageName, packageRoot, packageType }) =>
    packageSectionBuildLayerBroker({
      packageName,
      packageRoot,
      packageType,
      projectRoot,
    }),
  );

  const topLevelParts: ContentText[] = [
    contentTextContract.parse(
      `${projectMapStatics.symbolLegend}\n${projectMapStatics.urlPairingConvention}`,
    ),
    ...packageSections,
    pointerFooterRenderLayerBroker(),
  ];

  return contentTextContract.parse(topLevelParts.join('\n\n---\n\n'));
};
