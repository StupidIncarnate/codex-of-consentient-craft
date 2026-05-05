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
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
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

  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const orphanSection = architectureOrphanDetectBroker({ packageSrcPath });
  if (String(orphanSection).length > 0) {
    packageParts.push(orphanSection);
  }

  return contentTextContract.parse(packageParts.join('\n\n'));
};
