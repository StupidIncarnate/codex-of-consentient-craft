/**
 * PURPOSE: Compose the project-map slice for a caller-supplied list of packages: per-package
 * connection-graph view (boot, type-specific headline, side-channel) plus a pointer to the
 * per-package detail tool. Empty `packages` and unknown names throw.
 *
 * USAGE:
 * const markdown = await architectureProjectMapBroker({
 *   projectRoot: '/home/user/project',
 *   packages: ['mcp', 'shared'],
 * });
 * // Returns ContentText markdown with symbol legend, per-package sections, and pointer footer
 *
 * WHEN-TO-USE: When a caller knows which packages they need a connection-graph for
 */

import { architecturePackageTypeDetectBroker } from '../package-type-detect/architecture-package-type-detect-broker';
import { architectureGatewayInventoryBroker } from '../gateway-inventory/architecture-gateway-inventory-broker';
import { packageSectionBuildLayerBroker } from './package-section-build-layer-broker';
import { pointerFooterRenderLayerBroker } from './pointer-footer-render-layer-broker';
import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { gatewayLocationsStatics } from '../../../statics/gateway-locations/gateway-locations-statics';

export const architectureProjectMapBroker = async ({
  projectRoot,
  packages,
}: {
  projectRoot: string;
  packages: string[];
}): Promise<string> => {
  if (packages.length === 0) {
    throw new Error('get-project-map requires at least one package name in `packages`.');
  }

  const packagesPath = `${projectRoot}/${projectMapStatics.packagesDirName}`;
  const packageEntries = discoverPackagesLayerBroker({ dirPath: packagesPath });

  const scanTargets: {
    packageName: string;
    packageRoot: string;
  }[] = [];

  if (packageEntries.length > 0) {
    const sortedPackages = [...packageEntries].sort((a, b) => a.name.localeCompare(b.name));

    for (const pkg of sortedPackages) {
      const pkgRoot = `${projectRoot}/${projectMapStatics.packagesDirName}/${pkg.relativeDir}`;
      scanTargets.push({
        packageName: pkg.name,
        packageRoot: pkgRoot,
      });
    }
  } else {
    scanTargets.push({
      packageName: projectMapStatics.rootPackageName,
      packageRoot: projectRoot,
    });
  }

  const discoveredNames = scanTargets.map(({ packageName }) => packageName);
  const requestedNames = packages.map((name) => name);
  // '#gateway' is never a real directory under packages/ — discoverPackagesLayerBroker only ever
  // sees the four real gateway packages (npm, node, browser, bin) as separate entries — so it is
  // excluded from the "must be discoverable" check below and rendered as its own grouped section
  // instead, via architectureGatewayInventoryBroker.
  const gatewayGroupName = gatewayLocationsStatics.importPrefix;
  const isGatewayRequested = requestedNames.includes(gatewayGroupName);
  const namesRequiringDiscovery = requestedNames.filter((name) => name !== gatewayGroupName);
  const unknown = namesRequiringDiscovery.filter((name) => !discoveredNames.includes(name));
  if (unknown.length > 0) {
    const gatewayFolders: readonly string[] = Object.values(gatewayLocationsStatics.folders);
    const hasGateway = discoveredNames.some((name) => gatewayFolders.includes(name));
    const validNames = hasGateway
      ? [...discoveredNames.filter((name) => !gatewayFolders.includes(name)), gatewayGroupName]
      : [...discoveredNames];
    const validList = validNames.sort((a, b) => a.localeCompare(b)).join(', ');
    throw new Error(`Unknown package(s): ${unknown.join(', ')}. Valid: ${validList}`);
  }

  // The headline renderer is a single choice, so it takes the winning kind alone — the detector's
  // remaining kinds answer eligibility questions this map does not ask.
  const targetsWithType = await Promise.all(
    scanTargets.map(async ({ packageName, packageRoot }) => {
      const [packageType] = await architecturePackageTypeDetectBroker({ packageRoot });
      return { packageName, packageRoot, packageType };
    }),
  );

  const requestedTargets = targetsWithType.filter(({ packageName }) =>
    requestedNames.includes(packageName),
  );

  // A library package has no startup tree to walk, so it gets a header and a pointer instead of a
  // boot graph. Rendering nothing at all reads as "the package is missing", and a caller who asked
  // for it by name is owed an answer rather than silence.
  const packageSections = requestedTargets.map(({ packageName, packageRoot, packageType }) =>
    packageType === 'library'
      ? `# ${packageName} [${packageType}]\n\n${projectMapStatics.libraryNoFlowNotice}`
      : packageSectionBuildLayerBroker({
          packageName,
          packageRoot,
          packageType,
          projectRoot,
        }),
  );

  const orderedSections = isGatewayRequested
    ? [
        `# ${gatewayGroupName} [gateway] — outside packages, Node, the browser and installed programs, reached only through here\n\n${architectureGatewayInventoryBroker({ projectRoot })}`,
        ...packageSections,
      ]
    : packageSections;

  const topLevelParts: string[] = [
    `${projectMapStatics.symbolLegend}\n${projectMapStatics.urlPairingConvention}`,
    ...orderedSections,
    pointerFooterRenderLayerBroker(),
  ];

  return topLevelParts.join('\n\n---\n\n');
};
