/**
 * PURPOSE: Renders the Tools table for an mcp-server package in the project-map
 * connection-graph view. Tools are grouped by flow file.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineMcpServerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/mcp'),
 * });
 * // Returns ContentText markdown with ## Tools section
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as mcp-server type
 * WHEN-NOT-TO-USE: For non-mcp-server packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { listFlowFilesLayerBroker } from './list-flow-files-layer-broker';
import { toolsSectionRenderLayerBroker } from './tools-section-render-layer-broker';

export const architectureProjectMapHeadlineMcpServerBroker = ({
  projectRoot: _projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const flowFiles = listFlowFilesLayerBroker({ packageRoot });

  const toolsSection = toolsSectionRenderLayerBroker({ flowFiles, packageRoot });

  return contentTextContract.parse(`${String(toolsSection)}\n\n---`);
};
