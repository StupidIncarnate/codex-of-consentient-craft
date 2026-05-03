/**
 * PURPOSE: Reads a flow file and returns its react-router-dom &lt;Route&gt; metadata
 *
 * USAGE:
 * const routes = routeMetadataExtractLayerBroker({
 *   flowFile: absoluteFilePathContract.parse('/repo/packages/web/src/flows/quest-chat/quest-chat-flow.tsx'),
 * });
 * // Returns RouteMetadata[] with path + responderSymbol per Route
 *
 * WHEN-TO-USE: Boot-tree rendering for flows that compose React Router routes — non-web flows
 *   safely return [] because they contain no &lt;Route&gt; JSX
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { RouteMetadata } from '../../../contracts/route-metadata/route-metadata-contract';
import { routeMetadataExtractTransformer } from '../../../transformers/route-metadata-extract/route-metadata-extract-transformer';
import { readFileContentsLayerBroker } from './read-file-contents-layer-broker';

export const routeMetadataExtractLayerBroker = ({
  flowFile,
}: {
  flowFile: AbsoluteFilePath;
}): RouteMetadata[] => {
  const source = readFileContentsLayerBroker({ filePath: flowFile });
  if (source === undefined) {
    return [];
  }
  return routeMetadataExtractTransformer({ source });
};
