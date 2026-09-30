import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';

export const fileBusEdgesLayerBrokerProxy = (): {
  setup: ({ sourceFiles }: { sourceFiles: { path: string; source: string }[] }) => void;
} => {
  const listFilesProxy = listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();

  return {
    setup: ({ sourceFiles }: { sourceFiles: { path: string; source: string }[] }): void => {
      listFilesProxy.setupVirtualTree({ filePaths: sourceFiles.map((f) => f.path) });

      readFileProxy.setupImplementation({
        fn: (filePath: string): string =>
          sourceFiles.find((f) => f.path === filePath)?.source ?? '',
      });
    },
  };
};
