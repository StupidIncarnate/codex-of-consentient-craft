/**
 * PURPOSE: Builds the per-package markdown section for the project-map composer,
 * assembling the header line, boot tree, headline, side-channel, excluded audit, and inventory
 *
 * USAGE:
 * const section = packageSectionBuildLayerBroker({ packageName, packageRoot, packageType, srcPath, packageJsonPath, projectRoot });
 * // Returns ContentText with all sub-sections joined by \\n\\n
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker for each package in the monorepo
 */

import { architectureBootTreeBroker } from '../boot-tree/architecture-boot-tree-broker';
import { architectureSideChannelBroker } from '../side-channel/architecture-side-channel-broker';
import { architectureExcludedAuditBroker } from '../excluded-audit/architecture-excluded-audit-broker';
import { architecturePackageInventoryBroker } from '../package-inventory/architecture-package-inventory-broker';
import { headlineDispatchLayerBroker } from './headline-dispatch-layer-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';

export const packageSectionBuildLayerBroker = ({
  packageName,
  packageRoot,
  packageType,
  srcPath,
  packageJsonPath,
  projectRoot,
}: {
  packageName: ContentText;
  packageRoot: AbsoluteFilePath;
  packageType: PackageType;
  srcPath: AbsoluteFilePath;
  packageJsonPath: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const packageParts: ContentText[] = [];

  packageParts.push(contentTextContract.parse(`# ${String(packageName)} [${packageType}]`));

  if (packageType !== 'library') {
    packageParts.push(architectureBootTreeBroker({ packageRoot }));
  }

  packageParts.push(
    headlineDispatchLayerBroker({ packageType, projectRoot, packageRoot, packageName }),
  );

  const sideChannel = architectureSideChannelBroker({ projectRoot, packageRoot, packageName });
  if (String(sideChannel).length > 0) {
    packageParts.push(sideChannel);
  }

  packageParts.push(architectureExcludedAuditBroker({ packageRoot, packageName }));

  packageParts.push(
    contentTextContract.parse(
      `### Inventory\n\n${String(architecturePackageInventoryBroker({ packageName, srcPath, packageJsonPath }))}`,
    ),
  );

  return contentTextContract.parse(packageParts.join('\n\n'));
};
