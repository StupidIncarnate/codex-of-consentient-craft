/**
 * PURPOSE: Renders the cross-package EDGES footer section from HTTP edge graph results
 *
 * USAGE:
 * const footer = edgesFooterRenderLayerBroker({ projectRoot });
 * // Returns ContentText with ## EDGES section showing paired and orphan HTTP edge counts
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker to append the cross-package edges summary
 */

import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

export const edgesFooterRenderLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const edges = architectureEdgeGraphBroker({ projectRoot });
  const pairedCount = edges.filter((e) => e.paired).length;
  const orphanCount = edges.filter((e) => !e.paired).length;
  return contentTextContract.parse(
    `${projectMapStatics.edgesFooterHeader}\n\n\`\`\`\n${projectMapStatics.edgesFooterPairedLabel}: ${pairedCount}\n${projectMapStatics.edgesFooterOrphanLabel}: ${orphanCount}\n\`\`\``,
  );
};
