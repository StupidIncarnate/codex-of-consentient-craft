import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { architectureBackRefBrokerProxy } from '../back-ref/architecture-back-ref-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const SERVER_STATICS_PATH = '/repo/packages/server/src/statics/api-routes/api-routes-statics.ts';
const WEB_STATICS_PATH = '/repo/packages/web/src/statics/web-config/web-config-statics.ts';

export const httpEdgesToAnnotationsLayerBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    brokerFiles,
  }: {
    serverStaticsSource: ContentText;
    webStaticsSource: ContentText;
    flowFiles: { path: string; source: ContentText }[];
    brokerFiles: { path: string; source: ContentText }[];
  }) => void;
} => {
  const edgeGraphProxy = architectureEdgeGraphBrokerProxy();
  const backRefProxy = architectureBackRefBrokerProxy();

  return {
    setup: ({
      serverStaticsSource,
      webStaticsSource,
      flowFiles,
      brokerFiles,
    }: {
      serverStaticsSource: ContentText;
      webStaticsSource: ContentText;
      flowFiles: { path: string; source: ContentText }[];
      brokerFiles: { path: string; source: ContentText }[];
    }): void => {
      edgeGraphProxy.setup({ serverStaticsSource, webStaticsSource, flowFiles, brokerFiles });

      // Build file map for back-ref source lookups so consumer broker symbol extraction works.
      const fileMap = new Map<string, ContentText>();
      fileMap.set(SERVER_STATICS_PATH, serverStaticsSource);
      fileMap.set(WEB_STATICS_PATH, webStaticsSource);
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      for (const b of brokerFiles) {
        fileMap.set(b.path, b.source);
      }
      backRefProxy.setupImplementation({
        fn: (filePath: ContentText): ContentText => {
          for (const [key, source] of fileMap) {
            if (String(key) === String(filePath)) {
              return source;
            }
          }
          return ContentTextStub({ value: '' });
        },
      });
    },
  };
};
