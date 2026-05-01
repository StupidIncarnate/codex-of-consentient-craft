import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { routesForPackageFilterLayerBrokerProxy } from './routes-for-package-filter-layer-broker.proxy';
import { routesSectionRenderLayerBrokerProxy } from './routes-section-render-layer-broker.proxy';
import { exemplarEdgePickLayerBrokerProxy } from './exemplar-edge-pick-layer-broker.proxy';
import { exemplarSectionRenderLayerBrokerProxy } from './exemplar-section-render-layer-broker.proxy';

// Canonical statics file paths used by edge detection
const SERVER_STATICS_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/server/src/statics/api-routes/api-routes-statics.ts',
});
const WEB_STATICS_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/web/src/statics/web-config/web-config-statics.ts',
});

export const architectureProjectMapHeadlineHttpBackendBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    responderFiles,
    adapterFiles,
  }: {
    serverStaticsSource: ContentText;
    webStaticsSource: ContentText;
    flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    responderFiles: { path: AbsoluteFilePath; source: ContentText }[];
    adapterFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const edgeGraphProxy = architectureEdgeGraphBrokerProxy();
  routesForPackageFilterLayerBrokerProxy();
  routesSectionRenderLayerBrokerProxy();
  exemplarEdgePickLayerBrokerProxy();
  const exemplarProxy = exemplarSectionRenderLayerBrokerProxy();

  return {
    setup: ({
      serverStaticsSource,
      webStaticsSource,
      flowFiles,
      responderFiles,
      adapterFiles,
    }: {
      serverStaticsSource: ContentText;
      webStaticsSource: ContentText;
      flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
      responderFiles: { path: AbsoluteFilePath; source: ContentText }[];
      adapterFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      // Build unified file map covering statics, flow, responder, and adapter files
      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      fileMap.set(SERVER_STATICS_PATH, serverStaticsSource);
      fileMap.set(WEB_STATICS_PATH, webStaticsSource);
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      for (const r of responderFiles) {
        fileMap.set(r.path, r.source);
      }
      for (const a of adapterFiles) {
        fileMap.set(a.path, a.source);
      }

      const unifiedImpl = (filePath: ContentText): ContentText => {
        for (const [key, source] of fileMap) {
          if (String(key) === String(filePath)) {
            return source;
          }
        }
        // Return empty content for unknown files (edge-graph returns '' for unresolvable statics)
        return ContentTextStub({ value: '' });
      };

      // Set up edge-graph proxy (covers statics + flow source reads for HTTP edge detection)
      edgeGraphProxy.setup({
        serverStaticsSource,
        webStaticsSource,
        flowFiles,
        brokerFiles: [],
      });

      // Override the shared readFileSync handle with the unified implementation so that
      // both edge-graph and render-layer reads see the full file map (including responder/adapter files).
      // This must come AFTER edgeGraphProxy.setup() to overwrite its partial implementation.
      exemplarProxy.setupImplementation({ fn: unifiedImpl });
    },
  };
};
