import { architectureEdgeGraphBrokerProxy } from '../edge-graph/architecture-edge-graph-broker.proxy';
import { architectureBackRefBrokerProxy } from '../back-ref/architecture-back-ref-broker.proxy';

const SERVER_STATICS_PATH = '/repo/packages/server/src/statics/api-routes/api-routes-statics.ts';
const WEB_STATICS_PATH = '/repo/packages/web/src/statics/web-config/web-config-statics.ts';

export const httpEdgesToAnnotationsLayerBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    brokerFiles,
  }: {
    serverStaticsSource: string;
    webStaticsSource: string;
    flowFiles: { path: string; source: string }[];
    brokerFiles: { path: string; source: string }[];
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
      serverStaticsSource: string;
      webStaticsSource: string;
      flowFiles: { path: string; source: string }[];
      brokerFiles: { path: string; source: string }[];
    }): void => {
      edgeGraphProxy.setup({ serverStaticsSource, webStaticsSource, flowFiles, brokerFiles });

      // Build file map for back-ref source lookups so consumer broker symbol extraction works.
      const fileMap = new Map<string, string>();
      fileMap.set(SERVER_STATICS_PATH, serverStaticsSource);
      fileMap.set(WEB_STATICS_PATH, webStaticsSource);
      for (const f of flowFiles) {
        fileMap.set(f.path, f.source);
      }
      for (const b of brokerFiles) {
        fileMap.set(b.path, b.source);
      }
      backRefProxy.setupImplementation({
        fn: (filePath: string): string => {
          for (const [key, source] of fileMap) {
            if (String(key) === String(filePath)) {
              return source;
            }
          }
          return '';
        },
      });
    },
  };
};
