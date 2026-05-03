import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { routesForPackageFilterLayerBrokerProxy } from './routes-for-package-filter-layer-broker.proxy';
import { routesSectionRenderLayerBrokerProxy } from './routes-section-render-layer-broker.proxy';

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
  const routesSectionProxy = routesSectionRenderLayerBrokerProxy();

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
      // Build file map covering statics, flow, responder, and adapter files
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

      const fileImpl = (filePath: ContentText): ContentText => {
        for (const [key, source] of fileMap) {
          if (String(key) === String(filePath)) {
            return source;
          }
        }
        return ContentTextStub({ value: '' });
      };

      edgeGraphProxy.setup({
        serverStaticsSource,
        webStaticsSource,
        flowFiles,
        brokerFiles: [],
      });

      routesSectionProxy.setupImplementation({ fn: fileImpl });
    },
  };
};
