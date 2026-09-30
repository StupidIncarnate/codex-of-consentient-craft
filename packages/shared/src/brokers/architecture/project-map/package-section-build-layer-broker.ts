/**
 * PURPOSE: Builds the per-package markdown section for the project-map composer,
 * assembling the header line and the unified boot tree (with type-specific metadata
 * interspersed inline).
 *
 * USAGE:
 * const section = packageSectionBuildLayerBroker({ packageName, packageRoot, packageType, projectRoot });
 * // Returns ContentText with all sub-sections joined by \n\n
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker for each non-library package
 */

import { architectureBootTreeBroker } from '../boot-tree/architecture-boot-tree-broker';
import { architectureOrphanDetectBroker } from '../orphan-detect/architecture-orphan-detect-broker';
import { architectureResponderAnnotationsBroker } from '../responder-annotations/architecture-responder-annotations-broker';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';

export const packageSectionBuildLayerBroker = ({
  packageName,
  packageRoot,
  packageType,
  projectRoot,
}: {
  packageName: string;
  packageRoot: string;
  packageType: PackageType;
  projectRoot: string;
}): string => {
  const packageParts: string[] = [];

  packageParts.push(`# ${packageName} [${packageType}]`);

  const { responderAnnotations, startupAnnotations } = architectureResponderAnnotationsBroker({
    packageType,
    projectRoot,
    packageRoot,
  });

  packageParts.push(
    architectureBootTreeBroker({
      packageRoot,
      projectRoot,
      packageType,
      responderAnnotations,
      startupAnnotations,
    }),
  );

  const packageSrcPath = `${packageRoot}/src`;
  const orphanSection = architectureOrphanDetectBroker({ packageSrcPath });
  if (orphanSection.length > 0) {
    packageParts.push(orphanSection);
  }

  return packageParts.join('\n\n');
};
