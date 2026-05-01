/**
 * PURPOSE: Scans server flow files and web broker files to produce paired HTTP edge records,
 * joining on (method, urlPattern) after resolving statics member-expression references to
 * literal path strings via regex heuristics.
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
import { serverRouteCallsExtractTransformer } from '../../../transformers/server-route-calls-extract/server-route-calls-extract-transformer';
import { webFetchCallsExtractTransformer } from '../../../transformers/web-fetch-calls-extract/web-fetch-calls-extract-transformer';
import { staticsPathResolveTransformer } from '../../../transformers/statics-path-resolve/statics-path-resolve-transformer';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

const SERVER_FLOWS_REL = 'packages/server/src/flows';
const SERVER_STATICS_REL = 'packages/server/src/statics/api-routes/api-routes-statics.ts';
const WEB_BROKERS_REL = 'packages/web/src/brokers';
const WEB_STATICS_REL = 'packages/web/src/statics/web-config/web-config-statics.ts';

export const httpEdgesLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): HttpEdge[] => {
  const root = String(projectRoot);

  // Load statics source files for reference resolution
  const serverStaticsPath = absoluteFilePathContract.parse(`${root}/${SERVER_STATICS_REL}`);
  const webStaticsPath = absoluteFilePathContract.parse(`${root}/${WEB_STATICS_REL}`);

  const serverStaticsSource = readFileLayerBroker({ filePath: serverStaticsPath });
  const webStaticsSource = readFileLayerBroker({ filePath: webStaticsPath });

  // Collect server-side routes from all flow files
  const serverEntries: {
    method: ContentText;
    urlPattern: ContentText;
    flowFile: AbsoluteFilePath;
  }[] = [];
  const flowsDir = absoluteFilePathContract.parse(`${root}/${SERVER_FLOWS_REL}`);
  const flowFiles = listTsFilesLayerBroker({ dirPath: flowsDir });

  for (const flowFile of flowFiles) {
    if (!isNonTestFileGuard({ filePath: flowFile })) {
      continue;
    }
    const source = readFileLayerBroker({ filePath: flowFile });
    if (source === undefined) {
      continue;
    }
    const callSites = serverRouteCallsExtractTransformer({ source });
    for (const site of callSites) {
      const rawArg = String(site.rawArg);
      let urlPattern: ContentText = contentTextContract.parse(rawArg);
      if (rawArg.startsWith('apiRoutesStatics.') && serverStaticsSource !== undefined) {
        const resolved = staticsPathResolveTransformer({
          source: serverStaticsSource,
          dotPath: site.rawArg,
        });
        if (resolved === null) {
          continue;
        }
        urlPattern = resolved;
      }
      serverEntries.push({ method: site.method, urlPattern, flowFile });
    }
  }

  // Collect web-side fetch calls from all web broker files
  const webEntries: {
    method: ContentText;
    urlPattern: ContentText;
    brokerFile: AbsoluteFilePath;
  }[] = [];
  const brokersDir = absoluteFilePathContract.parse(`${root}/${WEB_BROKERS_REL}`);
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
      if (rawArg.startsWith('webConfigStatics.') && webStaticsSource !== undefined) {
        // Strip any trailing .replace(...) — the statics ref ends before the first .replace
        const staticsRef = rawArg.split('.replace')[0] ?? rawArg;
        const resolved = staticsPathResolveTransformer({
          source: webStaticsSource,
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
          serverResponderFile: null,
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
          serverResponderFile: null,
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
