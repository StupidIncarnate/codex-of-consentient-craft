/**
 * PURPOSE: Renders the Tools table and Detailed exemplar sections for an mcp-server package
 * in the project-map connection-graph view. Tools are grouped by flow file and the exemplar
 * traces the first discovered tool end-to-end when present.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineMcpServerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/mcp'),
 * });
 * // Returns ContentText markdown with ## Tools and ## Detailed exemplar sections
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as mcp-server type
 * WHEN-NOT-TO-USE: For non-mcp-server packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { mcpToolNamesExtractTransformer } from '../../../transformers/mcp-tool-names-extract/mcp-tool-names-extract-transformer';
import { mcpHandlerResponderExtractTransformer } from '../../../transformers/mcp-handler-responder-extract/mcp-handler-responder-extract-transformer';
import { listFlowFilesLayerBroker } from './list-flow-files-layer-broker';
import { readFlowSourceLayerBroker } from './read-flow-source-layer-broker';
import { toolsSectionRenderLayerBroker } from './tools-section-render-layer-broker';
import { exemplarSectionRenderLayerBroker } from './exemplar-section-render-layer-broker';

export const architectureProjectMapHeadlineMcpServerBroker = ({
  projectRoot: _projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const flowFiles = listFlowFilesLayerBroker({ packageRoot });

  const toolsSection = toolsSectionRenderLayerBroker({ flowFiles, packageRoot });

  // Pick the first tool from the first flow file that has tools for the exemplar
  let exemplarToolName: ContentText | null = null;
  let exemplarHandlerResponder: ContentText | null = null;

  for (const flowFile of flowFiles) {
    const source = readFlowSourceLayerBroker({ filePath: flowFile });
    if (source === undefined) continue;

    const toolNames = mcpToolNamesExtractTransformer({ source });
    const handlers = mcpHandlerResponderExtractTransformer({ source });

    if (toolNames.length > 0 && handlers.length > 0) {
      exemplarToolName = toolNames[0] ?? null;
      exemplarHandlerResponder = handlers[0] ?? null;
      break;
    }
  }

  if (exemplarToolName === null || exemplarHandlerResponder === null) {
    return contentTextContract.parse(`${String(toolsSection)}\n\n---`);
  }

  const exemplarSection = exemplarSectionRenderLayerBroker({
    toolName: exemplarToolName,
    handlerResponder: exemplarHandlerResponder,
    packageRoot,
  });

  return contentTextContract.parse(`${String(toolsSection)}\n\n---\n\n${String(exemplarSection)}`);
};
