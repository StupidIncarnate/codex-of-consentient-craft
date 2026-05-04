import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { architectureWsGatewayBrokerProxy } from '../ws-gateway/architecture-ws-gateway-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureWsEdgesBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
} => {
  const listFilesProxy = listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();
  // The gateway broker walks the same packages tree via its own listTsFiles/readFile
  // proxies. Initialise it so its file walks (which run inside this broker) don't
  // hit unmocked fs adapters when the test only sets up the WS-edges proxy.
  architectureWsGatewayBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      listFilesProxy.setupVirtualTree({ filePaths: sourceFiles.map((f) => f.path) });

      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const f of sourceFiles) {
        fileMap.set(f.path, f.source);
      }

      readFileProxy.setupImplementation({
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
