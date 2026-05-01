/**
 * PURPOSE: Generate compact codebase map showing packages, folder types, file counts, and domain names for LLM orientation
 *
 * USAGE:
 * const markdown = architectureProjectMapBroker({ projectRoot: absoluteFilePathContract.parse('/home/user/project') });
 * // Returns ContentText markdown with package folders, file counts, and domain/action summaries
 *
 * WHEN-TO-USE: When LLMs need a quick orientation of what exists where before making targeted discover calls
 */

import { architecturePackageInventoryBroker } from '../package-inventory/architecture-package-inventory-broker';
import { discoverPackagesLayerBroker } from './discover-packages-layer-broker';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const architectureProjectMapBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const packagesPath = absoluteFilePathContract.parse(
    `${projectRoot}/${projectMapStatics.packagesDirName}`,
  );
  const packagesEntries = discoverPackagesLayerBroker({ dirPath: packagesPath });
  const packageDirs = packagesEntries.filter((entry) => entry.isDirectory());

  const sections: ContentText[] = [contentTextContract.parse(projectMapStatics.header)];

  // Build scan targets: monorepo packages or single root
  const scanTargets: {
    packageName: ContentText;
    srcPath: AbsoluteFilePath;
    packageJsonPath: AbsoluteFilePath;
  }[] = [];

  if (packageDirs.length > 0) {
    const sortedPackages = [...packageDirs].sort((a, b) => a.name.localeCompare(b.name));

    for (const pkg of sortedPackages) {
      scanTargets.push({
        packageName: contentTextContract.parse(pkg.name),
        srcPath: absoluteFilePathContract.parse(
          `${projectRoot}/${projectMapStatics.packagesDirName}/${pkg.name}/${projectMapStatics.srcDirName}`,
        ),
        packageJsonPath: absoluteFilePathContract.parse(
          `${projectRoot}/${projectMapStatics.packagesDirName}/${pkg.name}/${projectMapStatics.packageJsonName}`,
        ),
      });
    }
  } else {
    scanTargets.push({
      packageName: contentTextContract.parse(projectMapStatics.rootPackageName),
      srcPath: absoluteFilePathContract.parse(`${projectRoot}/${projectMapStatics.srcDirName}`),
      packageJsonPath: absoluteFilePathContract.parse(
        `${projectRoot}/${projectMapStatics.packageJsonName}`,
      ),
    });
  }

  // Build section for each scan target by delegating to the package-inventory broker
  for (const { packageName, srcPath, packageJsonPath } of scanTargets) {
    sections.push(architecturePackageInventoryBroker({ packageName, srcPath, packageJsonPath }));
  }

  return contentTextContract.parse(sections.join('\n\n'));
};
