/**
 * PURPOSE: Builds a responder-annotation Map for an mcp-server package — for each responder
 * file that handles MCP tool registrations, emits a `[tools: a, b, c, ...]` suffix listing
 * every tool routed to it.
 *
 * USAGE:
 * const annotations = mcpToolsToAnnotationsLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/mcp'),
 * });
 * // Returns ResponderAnnotationMap keyed by responder file path
 *
 * WHEN-TO-USE: Inside architecture-responder-annotations-broker for mcp-server packages
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import type { ResponderAnnotation } from '../../../contracts/responder-annotation/responder-annotation-contract';
import { mcpToolNamesExtractTransformer } from '../../../transformers/mcp-tool-names-extract/mcp-tool-names-extract-transformer';
import { mcpHandlerResponderExtractTransformer } from '../../../transformers/mcp-handler-responder-extract/mcp-handler-responder-extract-transformer';
import { pascalCaseToKebabCaseTransformer } from '../../../transformers/pascal-case-to-kebab-case/pascal-case-to-kebab-case-transformer';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { architectureSourceReadBroker } from '../source-read/architecture-source-read-broker';
import { listFlowFilesLayerBroker } from './list-flow-files-layer-broker';

export const mcpToolsToAnnotationsLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ResponderAnnotationMap => {
  const flowFiles = listFlowFilesLayerBroker({ packageRoot });
  const result = new Map<AbsoluteFilePath, ResponderAnnotation>();

  // Collect tools per responder file.
  const toolsByResponder = new Map<AbsoluteFilePath, ContentText[]>();

  for (const flowFile of flowFiles) {
    const source = architectureSourceReadBroker({ filePath: flowFile });
    if (source === undefined) continue;

    const toolNames = mcpToolNamesExtractTransformer({ source });
    if (toolNames.length === 0) continue;

    const handlerSymbols = mcpHandlerResponderExtractTransformer({ source });

    // Build a map of kebab-case responder symbol → resolved responder file by walking the
    // flow's import statements. Keyed by ContentText (kebab symbol) for brand-safety.
    const importedResponderFiles = new Map<ContentText, AbsoluteFilePath>();
    const importPaths = importStatementsExtractTransformer({ source });
    for (const importPath of importPaths) {
      const resolved = relativeImportResolveTransformer({ sourceFile: flowFile, importPath });
      if (resolved === null) continue;
      const resolvedStr = String(resolved);
      if (!resolvedStr.includes('/responders/')) continue;
      const lastSlash = resolvedStr.lastIndexOf('/');
      const basename = resolvedStr.slice(lastSlash + 1);
      const dot = basename.lastIndexOf('.');
      const stem = dot === -1 ? basename : basename.slice(0, dot);
      importedResponderFiles.set(
        contentTextContract.parse(stem),
        absoluteFilePathContract.parse(resolvedStr),
      );
    }

    for (let i = 0; i < toolNames.length; i++) {
      const toolName = toolNames[i];
      if (toolName === undefined) continue;
      const handlerPascal = handlerSymbols[i] ?? handlerSymbols[0];
      if (handlerPascal === undefined) continue;
      const handlerKebab = pascalCaseToKebabCaseTransformer({ pascal: handlerPascal });
      // Find responder file via stringified key match (Map.get on branded keys can be flaky)
      const matched = [...importedResponderFiles.entries()].find(
        ([k]) => String(k) === String(handlerKebab),
      );
      if (matched === undefined) continue;
      const [, responderFile] = matched;

      const existing = toolsByResponder.get(responderFile);
      if (existing === undefined) {
        toolsByResponder.set(responderFile, [toolName]);
      } else {
        existing.push(toolName);
      }
    }
  }

  for (const [responderFile, tools] of toolsByResponder) {
    const suffix = contentTextContract.parse(`[tools: ${tools.map(String).join(', ')}]`);
    result.set(responderFile, { suffix, childLines: [] });
  }

  return responderAnnotationMapContract.parse(result);
};
