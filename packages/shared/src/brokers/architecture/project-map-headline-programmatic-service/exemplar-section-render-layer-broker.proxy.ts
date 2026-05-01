import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

export const exemplarSectionRenderLayerBrokerProxy = (): {
  setupFiles: ({ files }: { files: { path: AbsoluteFilePath; source: ContentText }[] }) => void;
  setupMissing: () => void;
} => {
  const readProxy = readSourceLayerBrokerProxy();

  return {
    setupFiles: ({ files }: { files: { path: AbsoluteFilePath; source: ContentText }[] }): void => {
      const fileMap = new Map<AbsoluteFilePath, ContentText>();
      for (const f of files) {
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

    setupMissing: (): void => {
      readProxy.setupMissing();
    },
  };
};
