/**
 * PURPOSE: Renders the Detailed exemplar section for one MCP tool, tracing handler responder →
 * adapter → cross-package method with a BOUNDARY box analogous to http-backend exemplar.
 *
 * USAGE:
 * const section = exemplarSectionRenderLayerBroker({
 *   toolName: contentTextContract.parse('discover'),
 *   handlerResponder: contentTextContract.parse('ArchitectureHandleResponder'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/mcp'),
 * });
 * // Returns ContentText with ## Detailed exemplar header and request chain code block
 *
 * WHEN-TO-USE: project-map-headline-mcp-server-broker building the Detailed exemplar section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineMcpServerStatics } from '../../../statics/project-map-headline-mcp-server/project-map-headline-mcp-server-statics';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { adapterFolderFromImportPathTransformer } from '../../../transformers/adapter-folder-from-import-path/adapter-folder-from-import-path-transformer';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { namespaceNameExtractTransformer } from '../../../transformers/namespace-name-extract/namespace-name-extract-transformer';
import { handlerNameToResponderPathTransformer } from '../../../transformers/handler-name-to-responder-path/handler-name-to-responder-path-transformer';
import { exemplarBoundaryBoxRenderLayerBroker } from './exemplar-boundary-box-render-layer-broker';
import { readFlowSourceLayerBroker } from './read-flow-source-layer-broker';

export const exemplarSectionRenderLayerBroker = ({
  toolName,
  handlerResponder,
  packageRoot,
}: {
  toolName: ContentText;
  handlerResponder: ContentText;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const toolNameStr = String(toolName);
  const handlerStr = String(handlerResponder);
  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);

  const titleLine = `${projectMapHeadlineMcpServerStatics.exemplarSectionPrefix}${toolNameStr}${projectMapHeadlineMcpServerStatics.exemplarSectionSuffix}`;

  const parts: ContentText[] = [
    contentTextContract.parse(titleLine),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineMcpServerStatics.exemplarDescription),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineMcpServerStatics.exemplarRequestChainHeader),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  // MCP call entry point
  parts.push(contentTextContract.parse(`MCP tool: ${toolNameStr}`));
  parts.push(contentTextContract.parse(`  → ${handlerStr}`));

  // Derive responder file path by convention and read its source
  const responderFilePath = handlerNameToResponderPathTransformer({
    handlerName: handlerResponder,
    packageSrcPath,
  });

  const responderSource = readFlowSourceLayerBroker({ filePath: responderFilePath });

  if (responderSource !== undefined) {
    const respImports = importStatementsExtractTransformer({ source: responderSource });
    const adapterImports = respImports.filter((p) => String(p).includes('adapters/'));

    if (adapterImports.length === 1) {
      const [adp] = adapterImports;
      if (adp !== undefined) {
        const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
        if (String(adpFolder) !== '') {
          parts.push(contentTextContract.parse(`      → ${String(adpFolder)}`));
        }
        const adpAbsPath = relativeImportResolveTransformer({
          sourceFile: responderFilePath,
          importPath: adp,
        });
        if (adpAbsPath !== null) {
          const adpSource = readFlowSourceLayerBroker({ filePath: adpAbsPath });
          if (adpSource !== undefined) {
            const call = namespaceCallFirstExtractTransformer({ source: adpSource });
            if (call !== null) {
              parts.push(contentTextContract.parse(`            → ${String(call)}`));
            }
            const namespaceName = namespaceNameExtractTransformer({ source: adpSource });
            parts.push(contentTextContract.parse(''));
            if (namespaceName !== null) {
              const boxLines = exemplarBoundaryBoxRenderLayerBroker({
                crossPackageName: namespaceName,
              });
              for (const boxLine of boxLines) {
                parts.push(boxLine);
              }
            }
          }
        }
      }
    } else if (adapterImports.length > 1) {
      for (let i = 0; i < adapterImports.length; i++) {
        const adp = adapterImports[i];
        if (adp === undefined) continue;
        const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
        const isLast = i === adapterImports.length - 1;
        const prefix = isLast ? '      └─→' : '      ├─→';
        if (String(adpFolder) !== '') {
          parts.push(contentTextContract.parse(`${prefix} ${String(adpFolder)}`));
        }
        const adpAbsPath = relativeImportResolveTransformer({
          sourceFile: responderFilePath,
          importPath: adp,
        });
        if (adpAbsPath !== null) {
          const adpSource = readFlowSourceLayerBroker({ filePath: adpAbsPath });
          if (adpSource !== undefined) {
            const call = namespaceCallFirstExtractTransformer({ source: adpSource });
            if (call !== null) {
              parts.push(contentTextContract.parse(`                  → ${String(call)}`));
            }
          }
        }
      }
    }
  }

  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(parts.map(String).join('\n'));
};
