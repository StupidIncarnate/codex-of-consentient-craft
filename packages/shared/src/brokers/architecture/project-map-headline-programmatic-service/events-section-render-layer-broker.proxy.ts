import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { listSourceFilesLayerBrokerProxy } from './list-source-files-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const eventsSectionRenderLayerBrokerProxy = (): {
  setup: ({
    sourceFiles,
  }: {
    sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
  }) => void;
  setupEmpty: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const listProxy = listSourceFilesLayerBrokerProxy();
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setup: ({
      sourceFiles,
    }: {
      sourceFiles: { path: AbsoluteFilePath; source: ContentText }[];
    }): void => {
      listProxy.setupFlatDirectory({ filePaths: sourceFiles.map((f) => f.path) });

      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const f of sourceFiles) {
        fileMap.set(f.path, f.source);
      }

      readProxy.setupImplementation({
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

    setupEmpty: (): void => {
      listProxy.setupEmpty();
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.setupImplementation({ fn });
    },
  };
};
