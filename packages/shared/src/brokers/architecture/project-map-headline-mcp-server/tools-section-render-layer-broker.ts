/**
 * PURPOSE: Renders the full Tools section for an mcp-server package, grouping tool entries by
 * flow file and producing a fenced code block per group.
 *
 * USAGE:
 * const section = toolsSectionRenderLayerBroker({
 *   flowFiles: [flowFilePath],
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/mcp'),
 * });
 * // Returns ContentText with ## Tools header + per-flow ### headers + code blocks
 *
 * WHEN-TO-USE: project-map-headline-mcp-server-broker building the Tools section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineMcpServerStatics } from '../../../statics/project-map-headline-mcp-server/project-map-headline-mcp-server-statics';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { mcpToolNamesExtractTransformer } from '../../../transformers/mcp-tool-names-extract/mcp-tool-names-extract-transformer';
import { mcpHandlerResponderExtractTransformer } from '../../../transformers/mcp-handler-responder-extract/mcp-handler-responder-extract-transformer';
import { readFlowSourceLayerBroker } from './read-flow-source-layer-broker';

export const toolsSectionRenderLayerBroker = ({
  flowFiles,
  packageRoot,
}: {
  flowFiles: AbsoluteFilePath[];
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const groups: {
    flowDisplay: ContentText;
    tools: { toolName: ContentText; handlerResponder: ContentText }[];
  }[] = [];

  for (const flowFile of flowFiles) {
    const source = readFlowSourceLayerBroker({ filePath: flowFile });
    if (source === undefined) continue;

    const toolNames = mcpToolNamesExtractTransformer({ source });
    if (toolNames.length === 0) continue;

    const handlers = mcpHandlerResponderExtractTransformer({ source });
    const flowDisplay = filePathToDisplayNameTransformer({
      filePath: flowFile,
      packageSrcPath,
    });

    const tools: { toolName: ContentText; handlerResponder: ContentText }[] = [];
    for (let i = 0; i < toolNames.length; i++) {
      const toolName = toolNames[i];
      if (toolName === undefined) continue;
      const handler = handlers[i] ?? handlers[0] ?? contentTextContract.parse('UnknownHandler');
      tools.push({ toolName, handlerResponder: handler });
    }

    if (tools.length > 0) {
      groups.push({ flowDisplay, tools });
    }
  }

  if (groups.length === 0) {
    return contentTextContract.parse(
      `${projectMapHeadlineMcpServerStatics.toolsSectionHeader}\n\n${projectMapHeadlineMcpServerStatics.toolsSectionEmpty}`,
    );
  }

  const sectionParts: ContentText[] = [
    contentTextContract.parse(projectMapHeadlineMcpServerStatics.toolsSectionHeader),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineMcpServerStatics.toolsSectionDescription),
  ];

  for (const group of groups) {
    const toolCount = group.tools.length;
    const plural = toolCount === 1 ? '' : 's';
    sectionParts.push(contentTextContract.parse(''));
    sectionParts.push(
      contentTextContract.parse(`### ${String(group.flowDisplay)}.ts (${toolCount} tool${plural})`),
    );
    sectionParts.push(contentTextContract.parse(''));
    sectionParts.push(contentTextContract.parse('```'));

    for (const tool of group.tools) {
      const padded = String(tool.toolName).padEnd(
        projectMapHeadlineMcpServerStatics.toolNamePadWidth,
      );
      sectionParts.push(contentTextContract.parse(`${padded} → ${String(tool.handlerResponder)}`));
    }

    sectionParts.push(contentTextContract.parse('```'));
  }

  return contentTextContract.parse(sectionParts.map(String).join('\n'));
};
