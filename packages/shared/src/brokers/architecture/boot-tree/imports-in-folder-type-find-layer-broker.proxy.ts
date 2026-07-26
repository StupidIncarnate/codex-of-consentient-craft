import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const importsInFolderTypeFindLayerBrokerProxy = (): {
  setupSource: ({
    sourceFile,
    content,
  }: {
    sourceFile: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissing: ({ sourceFile }: { sourceFile: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupTsExists: ({ result }: { result: boolean }) => void;
  setupTsxExists: ({ result }: { result: boolean }) => void;
} => {
  const fileProxy = readFileContentsLayerBrokerProxy();
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    setupSource: ({
      sourceFile,
      content,
    }: {
      sourceFile: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      fileProxy.setupReturns({ filePath: sourceFile, content });
    },

    setupMissing: ({ sourceFile }: { sourceFile: AbsoluteFilePath }): void => {
      fileProxy.setupMissing({ filePath: sourceFile });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      fileProxy.setupImplementation({ fn });
    },

    // No test in this file's suite calls setupTsExists/setupTsxExists today — the resolved
    // ts/tsx candidate path comes from relativeImportResolveTransformer (real, not mocked),
    // so there is no known filePath to key on here without duplicating that resolution.
    // Fall back to the adapter proxy's blind override (a sticky base default), which every
    // existing test already relies on implicitly via fsExistsSyncAdapterProxy's own
    // `false`-by-default fallback.
    setupTsExists: ({ result }: { result: boolean }): void => {
      existsProxy.implementation({ fn: () => result });
    },

    setupTsxExists: ({ result }: { result: boolean }): void => {
      existsProxy.implementation({ fn: () => result });
    },
  };
};
