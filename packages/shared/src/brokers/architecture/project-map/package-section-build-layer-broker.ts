/**
 * PURPOSE: Builds the per-package markdown section for the project-map composer,
 * assembling the header line, boot tree, headline, and side-channel
 *
 * USAGE:
 * const section = packageSectionBuildLayerBroker({ packageName, packageRoot, packageType, srcPath, packageJsonPath, projectRoot });
 * // Returns ContentText with all sub-sections joined by \\n\\n
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker for each package in the monorepo
 */

import { architectureBootTreeBroker } from '../boot-tree/architecture-boot-tree-broker';
import { architectureSideChannelBroker } from '../side-channel/architecture-side-channel-broker';
import { headlineDispatchLayerBroker } from './headline-dispatch-layer-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';

export const packageSectionBuildLayerBroker = ({
  packageName,
  packageRoot,
  packageType,
  projectRoot,
}: {
  packageName: ContentText;
  packageRoot: AbsoluteFilePath;
  packageType: PackageType;
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const packageParts: ContentText[] = [];

  packageParts.push(contentTextContract.parse(`# ${String(packageName)} [${packageType}]`));

  if (packageType !== 'library' && packageType !== 'http-backend') {
    packageParts.push(architectureBootTreeBroker({ packageRoot, projectRoot, packageType }));
  }

  const headline = headlineDispatchLayerBroker({
    packageType,
    projectRoot,
    packageRoot,
    packageName,
  });
  if (String(headline).length > 0) {
    packageParts.push(headline);
  }

  if (packageType !== 'library') {
    const sideChannel = architectureSideChannelBroker({
      projectRoot,
      packageRoot,
      packageName,
      packageType,
    });
    if (String(sideChannel).length > 0) {
      packageParts.push(sideChannel);
    }
  }

  return contentTextContract.parse(packageParts.join('\n\n'));
};
