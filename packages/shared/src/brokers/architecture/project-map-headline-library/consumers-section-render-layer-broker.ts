/**
 * PURPOSE: Renders the Consumers section for a library package by querying
 * architectureImportEdgesBroker and aggregating edges where sourcePackage matches
 * packageName. Lists distinct consumer package names and their total count.
 *
 * USAGE:
 * const section = consumersSectionRenderLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageName: contentTextContract.parse('shared'),
 * });
 * // Returns ContentText with ## Consumers header, comma-separated names, and count line
 *
 * WHEN-TO-USE: Library headline renderer consumer aggregation
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { architectureImportEdgesBroker } from '../import-edges/architecture-import-edges-broker';
import { projectMapHeadlineLibraryStatics } from '../../../statics/project-map-headline-library/project-map-headline-library-statics';

export const consumersSectionRenderLayerBroker = ({
  projectRoot,
  packageName,
}: {
  projectRoot: AbsoluteFilePath;
  packageName: ContentText;
}): ContentText => {
  const edges = architectureImportEdgesBroker({ projectRoot });

  const consumerSet = new Set<ContentText>();
  for (const edge of edges) {
    if (String(edge.sourcePackage) === String(packageName)) {
      consumerSet.add(edge.consumerPackage);
    }
  }

  const consumers = [...consumerSet].map(String).sort();
  const header = projectMapHeadlineLibraryStatics.consumersSectionHeader;

  if (consumers.length === 0) {
    return contentTextContract.parse(
      `${header}\n${projectMapHeadlineLibraryStatics.noConsumersLine}`,
    );
  }

  const consumerLine = consumers.join(', ');
  const countLine = `(${consumers.length} consumer package${consumers.length === 1 ? '' : 's'})`;

  return contentTextContract.parse(`${header}\n${consumerLine}\n${countLine}`);
};
