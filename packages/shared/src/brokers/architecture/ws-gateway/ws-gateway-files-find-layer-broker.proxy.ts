import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';

export const wsGatewayFilesFindLayerBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: string; source: string }[];
  }) => void;
} => {
  const listFilesProxy = listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: string; source: string }[];
    }): void => {
      listFilesProxy.setupVirtualTree({ filePaths: sourceFiles.map((f) => f.path) });

      const fileMap = new Map<string, string>();
      for (const f of sourceFiles) {
        fileMap.set(f.path, f.source);
      }

      readFileProxy.setupImplementation({
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
