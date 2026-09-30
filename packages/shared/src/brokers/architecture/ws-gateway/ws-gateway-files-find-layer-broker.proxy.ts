import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const wsGatewayFilesFindLayerBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: string; source: ContentText }[];
  }) => void;
} => {
  const listFilesProxy = listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: string; source: ContentText }[];
    }): void => {
      listFilesProxy.setupVirtualTree({ filePaths: sourceFiles.map((f) => f.path) });

      const fileMap = new Map<string, ContentText>();
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
