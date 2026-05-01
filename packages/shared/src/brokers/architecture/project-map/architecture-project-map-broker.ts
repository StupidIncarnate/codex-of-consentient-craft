/**
 * PURPOSE: Compose the full project-map: per-package connection-graph view (boot, type-specific
 * headline, side-channel, excluded audit, inventory counts) plus a cross-package EDGES footer and
 * a pointer to the per-package detail tool.
 *
 * USAGE:
 * const markdown = await architectureProjectMapBroker({ projectRoot: absoluteFilePathContract.parse('/home/user/project') });
 * // Returns ContentText markdown with symbol legend, per-package sections, EDGES footer, and pointer footer
 *
 * WHEN-TO-USE: When LLMs need a full connection-graph orientation of the codebase
 */

import { architecturePackageTypeDetectBroker } from '../package-type-detect/architecture-package-type-detect-broker';
import { packageSectionBuildLayerBroker } from './package-section-build-layer-broker';
import { edgesFooterRenderLayerBroker } from './edges-footer-render-layer-broker';
import { pointerFooterRenderLayerBroker } from './pointer-footer-render-layer-broker';
import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const architectureProjectMapBroker = async ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): Promise<ContentText> => {
  const packagesPath = absoluteFilePathContract.parse(
    `${projectRoot}/${projectMapStatics.packagesDirName}`,
  );
  const packagesEntries = discoverPackagesLayerBroker({ dirPath: packagesPath });
  const packageDirs = packagesEntries.filter((entry) => entry.isDirectory());

  const scanTargets: {
    packageName: ContentText;
    packageRoot: AbsoluteFilePath;
    srcPath: AbsoluteFilePath;
    packageJsonPath: AbsoluteFilePath;
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
        srcPath: absoluteFilePathContract.parse(`${pkgRoot}/${projectMapStatics.srcDirName}`),
        packageJsonPath: absoluteFilePathContract.parse(
          `${pkgRoot}/${projectMapStatics.packageJsonName}`,
        ),
      });
    }
  } else {
    const pkgRoot = projectRoot;
    scanTargets.push({
      packageName: contentTextContract.parse(projectMapStatics.rootPackageName),
      packageRoot: pkgRoot,
      srcPath: absoluteFilePathContract.parse(`${pkgRoot}/${projectMapStatics.srcDirName}`),
      packageJsonPath: absoluteFilePathContract.parse(
        `${pkgRoot}/${projectMapStatics.packageJsonName}`,
      ),
    });
  }

  const packageSections = await Promise.all(
    scanTargets.map(async ({ packageName, packageRoot, srcPath, packageJsonPath }) => {
      const packageType = await architecturePackageTypeDetectBroker({ packageRoot });
      return packageSectionBuildLayerBroker({
        packageName,
        packageRoot,
        packageType,
        srcPath,
        packageJsonPath,
        projectRoot,
      });
    }),
  );

  const topLevelParts: ContentText[] = [
    contentTextContract.parse(
      `${projectMapStatics.symbolLegend}\n${projectMapStatics.urlPairingConvention}`,
    ),
    ...packageSections,
    edgesFooterRenderLayerBroker({ projectRoot }),
    pointerFooterRenderLayerBroker(),
  ];

  return contentTextContract.parse(topLevelParts.join('\n\n---\n\n'));
};
