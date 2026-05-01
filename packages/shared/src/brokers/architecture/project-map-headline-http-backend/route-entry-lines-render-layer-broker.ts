/**
 * PURPOSE: Renders the display lines for one HTTP route entry inside a flow's code block.
 * Produces METHOD<pad> URL, then → responders/<folder>, then → adapters/<folder>,
 * then → Namespace.method({...}) lines by reading the flow source and responder source.
 *
 * USAGE:
 * const lines = routeEntryLinesRenderLayerBroker({
 *   edge,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns ContentText[] like ['POST   /api/quests/:questId/start', '  → responders/quest/start', ...]
 *
 * WHEN-TO-USE: routes-section-render-layer-broker building each route's text block
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import { projectMapHeadlineHttpBackendStatics } from '../../../statics/project-map-headline-http-backend/project-map-headline-http-backend-statics';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { responderFolderFromImportPathTransformer } from '../../../transformers/responder-folder-from-import-path/responder-folder-from-import-path-transformer';
import { adapterFolderFromImportPathTransformer } from '../../../transformers/adapter-folder-from-import-path/adapter-folder-from-import-path-transformer';
import { urlBestResponderImportPickTransformer } from '../../../transformers/url-best-responder-import-pick/url-best-responder-import-pick-transformer';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const routeEntryLinesRenderLayerBroker = ({
  edge,
  packageRoot: _packageRoot,
}: {
  edge: HttpEdge;
  packageRoot: AbsoluteFilePath;
}): ContentText[] => {
  const method = String(edge.method).padEnd(projectMapHeadlineHttpBackendStatics.methodPadWidth);
  const url = String(edge.urlPattern);
  const firstLine = contentTextContract.parse(`${method} ${url}`);

  if (edge.serverFlowFile === null) {
    return [firstLine];
  }

  const flowSource = readSourceLayerBroker({ filePath: edge.serverFlowFile });
  if (flowSource === undefined) {
    return [firstLine];
  }

  const allImports = importStatementsExtractTransformer({ source: flowSource });
  const responderImports = allImports.filter((p) => String(p).includes('responders/'));

  const bestResponderImport = urlBestResponderImportPickTransformer({
    urlPattern: contentTextContract.parse(url),
    responderImports,
  });

  if (bestResponderImport === null) {
    return [firstLine];
  }

  const responderFolder = responderFolderFromImportPathTransformer({
    importPath: bestResponderImport,
  });
  const lines: ContentText[] = [firstLine];
  if (String(responderFolder) !== '') {
    lines.push(contentTextContract.parse(`  → ${String(responderFolder)}`));
  }

  const responderAbsPath = relativeImportResolveTransformer({
    sourceFile: edge.serverFlowFile,
    importPath: bestResponderImport,
  });
  if (responderAbsPath === null) {
    return lines;
  }

  const responderSource = readSourceLayerBroker({ filePath: responderAbsPath });
  if (responderSource === undefined) {
    return lines;
  }

  const respImports = importStatementsExtractTransformer({ source: responderSource });
  const adapterImports = respImports.filter((p) => String(p).includes('adapters/'));

  if (adapterImports.length === 0) {
    return lines;
  }

  if (adapterImports.length === 1) {
    const [adp] = adapterImports;
    if (adp === undefined) return lines;

    const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
    if (String(adpFolder) !== '') {
      lines.push(contentTextContract.parse(`  → ${String(adpFolder)}`));
    }

    const adpAbsPath = relativeImportResolveTransformer({
      sourceFile: responderAbsPath,
      importPath: adp,
    });
    if (adpAbsPath !== null) {
      const adpSource = readSourceLayerBroker({ filePath: adpAbsPath });
      if (adpSource !== undefined) {
        const call = namespaceCallFirstExtractTransformer({ source: adpSource });
        if (call !== null) {
          lines.push(contentTextContract.parse(`  → ${String(call)}`));
        }
      }
    }
  } else {
    for (let i = 0; i < adapterImports.length; i++) {
      const adp = adapterImports[i];
      if (adp === undefined) continue;

      const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
      const isLast = i === adapterImports.length - 1;
      const prefix = isLast ? '  └─' : '  ├─';
      if (String(adpFolder) !== '') {
        lines.push(contentTextContract.parse(`${prefix} ${String(adpFolder)}`));
      }

      const adpAbsPath = relativeImportResolveTransformer({
        sourceFile: responderAbsPath,
        importPath: adp,
      });
      if (adpAbsPath !== null) {
        const adpSource = readSourceLayerBroker({ filePath: adpAbsPath });
        if (adpSource !== undefined) {
          const call = namespaceCallFirstExtractTransformer({ source: adpSource });
          if (call !== null) {
            lines.push(contentTextContract.parse(`        → ${String(call)}`));
          }
        }
      }
    }
  }

  return lines;
};
