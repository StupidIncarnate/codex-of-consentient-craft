/**
 * PURPOSE: Renders the Side-channel section of the project-map for a package — the async
 * cascade that runs after the synchronous HTTP response returns: in-memory bus emissions,
 * file-bus appends, downstream WS subscribers, and their relay path to frontend consumers.
 *
 * USAGE:
 * const section = architectureSideChannelBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 *   packageName: contentTextContract.parse('@dungeonmaster/orchestrator'),
 * });
 * // Returns '' when the package has no WS or file-bus edges
 * // Returns '---\n\n## Side-channel ...\n\n```\n...\n```' otherwise
 *
 * WHEN-TO-USE: As part of the project-map per-package renderer for any package that emits
 * WS events or writes to a file-bus path
 * WHEN-NOT-TO-USE: Library or config packages with no event/bus activity
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import { architectureWsEdgesBroker } from '../ws-edges/architecture-ws-edges-broker';
import { architectureFileBusEdgesBroker } from '../file-bus-edges/architecture-file-bus-edges-broker';
import { wsEdgesFilterLayerBroker } from './ws-edges-filter-layer-broker';
import { fileBusEdgesFilterLayerBroker } from './file-bus-edges-filter-layer-broker';
import { sideChannelRenderLayerBroker } from './side-channel-render-layer-broker';

const HTTP_BACKEND_SECTION_HEADER = '## Side-channel — after the HTTP response returns';
const GENERIC_SECTION_HEADER = '## Side-channel — async cascade after the request returns';

export const architectureSideChannelBroker = ({
  projectRoot,
  packageRoot,
  packageName,
  packageType,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
  packageName: ContentText;
  packageType?: PackageType;
}): ContentText => {
  const wsEdges = architectureWsEdgesBroker({ projectRoot });
  const fileBusEdges = architectureFileBusEdgesBroker({ projectRoot });

  const { emitterEdges: wsEmitterEdges, consumerEdges: wsConsumerEdges } = wsEdgesFilterLayerBroker(
    { wsEdges, packageRoot },
  );

  const { writerEdges: fileBusWriterEdges, watcherEdges: fileBusWatcherEdges } =
    fileBusEdgesFilterLayerBroker({ fileBusEdges, packageRoot });

  const hasAnyEdge =
    wsEmitterEdges.length > 0 ||
    wsConsumerEdges.length > 0 ||
    fileBusWriterEdges.length > 0 ||
    fileBusWatcherEdges.length > 0;

  if (!hasAnyEdge) {
    return contentTextContract.parse('');
  }

  const codeBlockBody = sideChannelRenderLayerBroker({
    wsEmitterEdges,
    wsConsumerEdges,
    fileBusWriterEdges,
    fileBusWatcherEdges,
    projectRoot,
    packageName,
  });

  if (String(codeBlockBody).trim().length === 0) {
    return contentTextContract.parse('');
  }

  const sectionHeader =
    packageType === 'http-backend' ? HTTP_BACKEND_SECTION_HEADER : GENERIC_SECTION_HEADER;
  return contentTextContract.parse(
    `---\n\n${sectionHeader}\n\n\`\`\`\n${String(codeBlockBody)}\n\`\`\``,
  );
};
