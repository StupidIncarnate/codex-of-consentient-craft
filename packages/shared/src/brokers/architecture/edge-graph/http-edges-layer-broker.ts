/**
 * PURPOSE: Scans every http-backend package's flow files and every frontend package's broker
 * files to produce paired HTTP edge records, joining on (method, urlPattern) after resolving
 * statics member-expression references to literal path strings via regex heuristics. Packages are
 * grouped by packageType (resolvePackageGroupsLayerBroker), never by name, so a repo with several
 * backend or UI packages gets every one of them scanned.
 *
 * USAGE:
 * const edges = httpEdgesLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns HttpEdge[] with paired=true for server+web matches, paired=false for orphans
 *
 * WHEN-TO-USE: Building the EDGES footer in the project-map connection-graph view
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (this is a regex v1 heuristic)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { httpEdgeContract, type HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { namedImportsToPathMapTransformer } from '../../../transformers/named-imports-to-path-map/named-imports-to-path-map-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { serverRouteCallsExtractTransformer } from '../../../transformers/server-route-calls-extract/server-route-calls-extract-transformer';
import { webFetchCallsExtractTransformer } from '../../../transformers/web-fetch-calls-extract/web-fetch-calls-extract-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';
import { resolvePackageGroupsLayerBroker } from './resolve-package-groups-layer-broker';
import { resolveStaticsFirstMatchLayerBroker } from './resolve-statics-first-match-layer-broker';

export const httpEdgesLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): HttpEdge[] => {
  const { httpBackendRoots, frontendRoots } = resolvePackageGroupsLayerBroker({ projectRoot });

  // Load every http-backend package's api-routes statics source and every frontend package's
  // web-config statics source — a repo may run several of either.
  const serverStaticsSources: ContentText[] = [];
  for (const backendRoot of httpBackendRoots) {
    const source = readFileLayerBroker({
      filePath: absoluteFilePathContract.parse(
        `${backendRoot}/src/statics/api-routes/api-routes-statics.ts`,
      ),
    });
    if (source !== undefined) {
      serverStaticsSources.push(source);
    }
  }

  const webStaticsSources: ContentText[] = [];
  for (const frontendRoot of frontendRoots) {
    const source = readFileLayerBroker({
      filePath: absoluteFilePathContract.parse(
        `${frontendRoot}/src/statics/web-config/web-config-statics.ts`,
      ),
    });
    if (source !== undefined) {
      webStaticsSources.push(source);
    }
  }

  // Collect server-side routes from every http-backend package's flow files
  const serverEntries: {
    method: ContentText;
    urlPattern: ContentText;
    flowFile: AbsoluteFilePath;
    responderFile: AbsoluteFilePath | null;
  }[] = [];

  for (const backendRoot of httpBackendRoots) {
    const flowsDir = absoluteFilePathContract.parse(`${backendRoot}/src/flows`);
    const flowFiles = listTsFilesLayerBroker({ dirPath: flowsDir });

    for (const flowFile of flowFiles) {
      if (!isNonTestFileGuard({ filePath: flowFile })) {
        continue;
      }
      const source = readFileLayerBroker({ filePath: flowFile });
      if (source === undefined) {
        continue;
      }
      const importMap = namedImportsToPathMapTransformer({ source });
      const callSites = serverRouteCallsExtractTransformer({ source });
      for (const site of callSites) {
        const rawArg = String(site.rawArg);
        let urlPattern: ContentText = contentTextContract.parse(rawArg);
        if (rawArg.startsWith('apiRoutesStatics.')) {
          const resolved = resolveStaticsFirstMatchLayerBroker({
            sources: serverStaticsSources,
            dotPath: site.rawArg,
          });
          if (resolved === null) {
            continue;
          }
          urlPattern = resolved;
        }

        let responderFile: AbsoluteFilePath | null = null;
        if (site.responderName !== null) {
          // Find the import path for the responder name (Map keys are branded ContentText, so
          // we iterate to compare by string value).
          let importPath: ContentText | null = null;
          for (const [name, path] of importMap) {
            if (String(name) === String(site.responderName)) {
              importPath = path;
              break;
            }
          }
          if (importPath !== null) {
            responderFile = relativeImportResolveTransformer({
              sourceFile: flowFile,
              importPath,
            });
          }
        }

        serverEntries.push({ method: site.method, urlPattern, flowFile, responderFile });
      }
    }
  }

  // Collect web-side fetch calls from every frontend package's broker files
  const webEntries: {
    method: ContentText;
    urlPattern: ContentText;
    brokerFile: AbsoluteFilePath;
  }[] = [];

  for (const frontendRoot of frontendRoots) {
    const brokersDir = absoluteFilePathContract.parse(`${frontendRoot}/src/brokers`);
    const brokerFiles = listTsFilesLayerBroker({ dirPath: brokersDir });

    for (const brokerFile of brokerFiles) {
      if (!isNonTestFileGuard({ filePath: brokerFile })) {
        continue;
      }
      const source = readFileLayerBroker({ filePath: brokerFile });
      if (source === undefined) {
        continue;
      }
      const callSites = webFetchCallsExtractTransformer({ source });
      for (const site of callSites) {
        const rawArg = String(site.rawArg);
        let urlPattern: ContentText = contentTextContract.parse(rawArg);
        if (rawArg.startsWith('webConfigStatics.')) {
          // Strip any trailing .replace(...) — the statics ref ends before the first .replace
          const staticsRef = rawArg.split('.replace')[0] ?? rawArg;
          const resolved = resolveStaticsFirstMatchLayerBroker({
            sources: webStaticsSources,
            dotPath: contentTextContract.parse(staticsRef),
          });
          if (resolved === null) {
            continue;
          }
          urlPattern = resolved;
        }
        webEntries.push({ method: site.method, urlPattern, brokerFile });
      }
    }
  }

  // Join server entries with web entries on (method, urlPattern)
  const edges: HttpEdge[] = [];
  const matchedWebFiles = new Set<AbsoluteFilePath>();

  for (const server of serverEntries) {
    const web = webEntries.find(
      (w) =>
        String(w.method) === String(server.method) &&
        String(w.urlPattern) === String(server.urlPattern),
    );
    if (web === undefined) {
      edges.push(
        httpEdgeContract.parse({
          method: server.method,
          urlPattern: server.urlPattern,
          serverFlowFile: server.flowFile,
          serverResponderFile: server.responderFile,
          webBrokerFile: null,
          paired: false,
        }),
      );
    } else {
      matchedWebFiles.add(web.brokerFile);
      edges.push(
        httpEdgeContract.parse({
          method: server.method,
          urlPattern: server.urlPattern,
          serverFlowFile: server.flowFile,
          serverResponderFile: server.responderFile,
          webBrokerFile: web.brokerFile,
          paired: true,
        }),
      );
    }
  }

  // Emit orphan web entries (no server match)
  for (const web of webEntries) {
    if (matchedWebFiles.has(web.brokerFile)) {
      continue;
    }
    edges.push(
      httpEdgeContract.parse({
        method: web.method,
        urlPattern: web.urlPattern,
        serverFlowFile: null,
        serverResponderFile: null,
        webBrokerFile: web.brokerFile,
        paired: false,
      }),
    );
  }

  return edges;
};
