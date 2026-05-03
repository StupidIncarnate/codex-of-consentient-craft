/**
 * PURPOSE: Renders the display lines for one HTTP route entry inside a flow's code block.
 * Produces METHOD<pad> URL, then ← consumer back-refs (one per webBrokerFile across all
 * edges sharing the same method+urlPattern, for fan-in visibility), then → responders/<folder>,
 * then → adapters/<folder>, then → Namespace.method({...}) lines using the responder file
 * resolved during edge extraction.
 *
 * USAGE:
 * const lines = routeEntryLinesRenderLayerBroker({
 *   edges,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns ContentText[] like ['POST   /api/x', '  ← packages/web (useFooBinding)', '  → responders/x', ...]
 *
 * WHEN-TO-USE: routes-section-render-layer-broker building each route's text block. Caller
 * groups edges by (method, urlPattern) before invoking so fan-in is visible.
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
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { architectureBackRefBroker } from '../back-ref/architecture-back-ref-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const routeEntryLinesRenderLayerBroker = ({
  edges,
  packageRoot: _packageRoot,
  projectRoot,
}: {
  edges: HttpEdge[];
  packageRoot: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
}): ContentText[] => {
  const [edge] = edges;
  if (edge === undefined) {
    return [];
  }
  const method = String(edge.method).padEnd(projectMapHeadlineHttpBackendStatics.methodPadWidth);
  const url = String(edge.urlPattern);
  const firstLine = contentTextContract.parse(`${method} ${url}`);

  const consumerLines: ContentText[] = [];
  const seenConsumers: AbsoluteFilePath[] = [];
  for (const e of edges) {
    if (e.webBrokerFile === null) continue;
    const alreadySeen = seenConsumers.some((s) => String(s) === String(e.webBrokerFile));
    if (alreadySeen) continue;
    seenConsumers.push(e.webBrokerFile);
    const ref = architectureBackRefBroker({ filePath: e.webBrokerFile, projectRoot });
    if (ref === null) continue;
    consumerLines.push(contentTextContract.parse(`  ← ${String(ref)}`));
  }

  if (edge.serverResponderFile === null) {
    return [firstLine, ...consumerLines];
  }

  const responderFolder = responderFolderFromImportPathTransformer({
    importPath: contentTextContract.parse(String(edge.serverResponderFile)),
  });
  const lines: ContentText[] = [firstLine, ...consumerLines];
  if (String(responderFolder) !== '') {
    lines.push(contentTextContract.parse(`  → ${String(responderFolder)}`));
  }

  const responderSource = readSourceLayerBroker({ filePath: edge.serverResponderFile });
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
    if (String(adpFolder) === '') return lines;

    const adpAbsPath = relativeImportResolveTransformer({
      sourceFile: edge.serverResponderFile,
      importPath: adp,
    });
    let callSuffix = '';
    if (adpAbsPath !== null) {
      const adpSource = readSourceLayerBroker({ filePath: adpAbsPath });
      if (adpSource !== undefined) {
        const call = namespaceCallFirstExtractTransformer({ source: adpSource });
        if (call !== null) {
          callSuffix = ` → ${String(call)}`;
        }
      }
    }
    lines.push(contentTextContract.parse(`    → ${String(adpFolder)}${callSuffix}`));
  } else {
    for (let i = 0; i < adapterImports.length; i += 1) {
      const adp = adapterImports[i];
      if (adp === undefined) continue;

      const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
      const isLast = i === adapterImports.length - 1;
      const prefix = isLast ? '    └─' : '    ├─';
      if (String(adpFolder) === '') continue;

      const adpAbsPath = relativeImportResolveTransformer({
        sourceFile: edge.serverResponderFile,
        importPath: adp,
      });
      let callSuffix = '';
      if (adpAbsPath !== null) {
        const adpSource = readSourceLayerBroker({ filePath: adpAbsPath });
        if (adpSource !== undefined) {
          const call = namespaceCallFirstExtractTransformer({ source: adpSource });
          if (call !== null) {
            callSuffix = ` → ${String(call)}`;
          }
        }
      }
      lines.push(contentTextContract.parse(`${prefix} ${String(adpFolder)}${callSuffix}`));
    }
  }

  return lines;
};
