import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const adapterImportsFindLayerBrokerProxy = (): {
  setupSource: ({
    sourceFile,
    content,
  }: {
    sourceFile: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissing: ({ sourceFile }: { sourceFile: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();

  return {
    setupSource: ({
      sourceFile,
      content,
    }: {
      sourceFile: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      importsProxy.setupSource({ sourceFile, content });
    },

    setupMissing: ({ sourceFile }: { sourceFile: AbsoluteFilePath }): void => {
      importsProxy.setupMissing({ sourceFile });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      importsProxy.setupImplementation({ fn });
    },
  };
};
