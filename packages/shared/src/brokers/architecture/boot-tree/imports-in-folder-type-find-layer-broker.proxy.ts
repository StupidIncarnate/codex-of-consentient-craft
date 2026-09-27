import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
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
  // The resolved ts/tsx candidate path comes from relativeImportResolveTransformer (real, not
  // mocked), so there is no known path to key on here — an always-true predicate is the explicit
  // "answer any call" stage setupTsExists/setupTsxExists need. Defaults to false (neither
  // candidate exists, so the caller falls back to the resolved .ts path) so every test that never
  // calls setupTsExists/setupTsxExists still gets an answer instead of an unmatched-call throw;
  // an explicit setupTsExists/setupTsxExists call overrides it, since a later registration of
  // equal specificity wins.
  const existsProxy = existsSyncProxy();
  existsProxy.returnsMatchingPath({ path: (): boolean => true, exists: false });

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

    setupTsExists: ({ result }: { result: boolean }): void => {
      existsProxy.returnsMatchingPath({ path: (): boolean => true, exists: result });
    },

    setupTsxExists: ({ result }: { result: boolean }): void => {
      existsProxy.returnsMatchingPath({ path: (): boolean => true, exists: result });
    },
  };
};
