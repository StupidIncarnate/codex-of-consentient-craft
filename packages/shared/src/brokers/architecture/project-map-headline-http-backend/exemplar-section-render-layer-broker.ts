/**
 * PURPOSE: Renders the Detailed exemplar section for one HTTP route, tracing caller widget →
 * web broker → HTTP wire → server flow → responder → adapters → BOUNDARY box → response.
 *
 * USAGE:
 * const section = exemplarSectionRenderLayerBroker({
 *   edge,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns ContentText with ## Detailed exemplar header and request chain code block
 *
 * WHEN-TO-USE: project-map-headline-http-backend-broker building the Detailed exemplar section
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import { projectMapHeadlineHttpBackendStatics } from '../../../statics/project-map-headline-http-backend/project-map-headline-http-backend-statics';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { flowGroupFromFilePathTransformer } from '../../../transformers/flow-group-from-file-path/flow-group-from-file-path-transformer';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { responderFolderFromImportPathTransformer } from '../../../transformers/responder-folder-from-import-path/responder-folder-from-import-path-transformer';
import { adapterFolderFromImportPathTransformer } from '../../../transformers/adapter-folder-from-import-path/adapter-folder-from-import-path-transformer';
import { urlBestResponderImportPickTransformer } from '../../../transformers/url-best-responder-import-pick/url-best-responder-import-pick-transformer';
import { namespaceCallFirstExtractTransformer } from '../../../transformers/namespace-call-first-extract/namespace-call-first-extract-transformer';
import { exemplarBoundaryBoxRenderLayerBroker } from './exemplar-boundary-box-render-layer-broker';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const exemplarSectionRenderLayerBroker = ({
  edge,
  packageRoot,
}: {
  edge: HttpEdge;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const method = contentTextContract.parse(String(edge.method));
  const urlPattern = contentTextContract.parse(String(edge.urlPattern));
  const methodStr = String(method);
  const urlStr = String(urlPattern);

  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);

  const titleLine = `${projectMapHeadlineHttpBackendStatics.exemplarSectionPrefix}${methodStr} ${urlStr}${projectMapHeadlineHttpBackendStatics.exemplarSectionSuffix}`;

  const parts: ContentText[] = [
    contentTextContract.parse(titleLine),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineHttpBackendStatics.exemplarDescription),
    contentTextContract.parse(''),
    contentTextContract.parse(projectMapHeadlineHttpBackendStatics.exemplarRequestChainHeader),
    contentTextContract.parse(''),
    contentTextContract.parse('```'),
  ];

  // Web caller side — rendered when edge is paired with a web broker
  if (edge.webBrokerFile !== null) {
    const webSrcPath = absoluteFilePathContract.parse(
      `${String(packageSrcPath).split('/packages/')[0]}/packages/web/src`,
    );
    const webDisplay = filePathToDisplayNameTransformer({
      filePath: edge.webBrokerFile,
      packageSrcPath: webSrcPath,
    });
    parts.push(contentTextContract.parse(`web/${String(webDisplay)}`));
    parts.push(
      contentTextContract.parse(
        `  → web/adapters/fetch/${methodStr.toLowerCase()}/fetch-${methodStr.toLowerCase()}-adapter`,
      ),
    );
    parts.push(contentTextContract.parse(`  → web/statics/web-config/web-config-statics`));
    parts.push(contentTextContract.parse(''));
    parts.push(contentTextContract.parse(`       ─── HTTP ${methodStr} ${urlStr}  body: {} ───►`));
    parts.push(contentTextContract.parse(''));
  }

  // Server flow side
  if (edge.serverFlowFile !== null) {
    const flowDisplay = filePathToDisplayNameTransformer({
      filePath: edge.serverFlowFile,
      packageSrcPath,
    });
    const flowGroup = flowGroupFromFilePathTransformer({ filePath: edge.serverFlowFile });

    parts.push(contentTextContract.parse(`server/${String(flowDisplay)}.ts`));
    parts.push(
      contentTextContract.parse(
        `  registers: app.${methodStr.toLowerCase()}(apiRoutesStatics.${String(flowGroup)}.${
          urlStr
            .split('/')
            .filter((s) => s !== '' && !s.startsWith(':') && s !== 'api')
            .pop() ?? 'route'
        }, handler)`,
      ),
    );

    // Find best responder import and render responder + adapters
    const flowSource = readSourceLayerBroker({ filePath: edge.serverFlowFile });
    if (flowSource !== undefined) {
      const allImports = importStatementsExtractTransformer({ source: flowSource });
      const responderImports = allImports.filter((p) => String(p).includes('responders/'));

      const bestResponderImport = urlBestResponderImportPickTransformer({
        urlPattern,
        responderImports,
      });

      if (bestResponderImport !== null) {
        const responderFolder = responderFolderFromImportPathTransformer({
          importPath: bestResponderImport,
        });
        if (String(responderFolder) !== '') {
          parts.push(contentTextContract.parse(`  → server/${String(responderFolder)}`));
        }

        const responderAbsPath = relativeImportResolveTransformer({
          sourceFile: edge.serverFlowFile,
          importPath: bestResponderImport,
        });

        if (responderAbsPath !== null) {
          const responderSource = readSourceLayerBroker({ filePath: responderAbsPath });
          if (responderSource !== undefined) {
            const respImports = importStatementsExtractTransformer({ source: responderSource });
            const adapterImports = respImports.filter((p) => String(p).includes('adapters/'));

            if (adapterImports.length === 1) {
              const [adp] = adapterImports;
              if (adp !== undefined) {
                const adpFolder = adapterFolderFromImportPathTransformer({ importPath: adp });
                if (String(adpFolder) !== '') {
                  parts.push(contentTextContract.parse(`      → server/${String(adpFolder)}`));
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
                      parts.push(contentTextContract.parse(`            → ${String(call)}`));
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
                  parts.push(contentTextContract.parse(`${prefix} server/${String(adpFolder)}`));
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
                      parts.push(contentTextContract.parse(`                  → ${String(call)}`));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  parts.push(contentTextContract.parse(''));

  // BOUNDARY box
  const crossPackageName = contentTextContract.parse(
    projectMapHeadlineHttpBackendStatics.orchestratorPackageName,
  );
  const boxLines = exemplarBoundaryBoxRenderLayerBroker({ method, urlPattern, crossPackageName });
  for (const boxLine of boxLines) {
    parts.push(boxLine);
  }

  parts.push(contentTextContract.parse(''));
  parts.push(contentTextContract.parse(projectMapHeadlineHttpBackendStatics.exemplarResponseLine));
  parts.push(contentTextContract.parse('```'));

  return contentTextContract.parse(parts.map(String).join('\n'));
};
