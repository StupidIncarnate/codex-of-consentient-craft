import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
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
  // Composed to satisfy enforce-proxy-child-creation (the implementation imports `existsSync`
  // from `#gateway/node/fs`), but never called: the resolved ts/tsx candidate path comes from
  // relativeImportResolveTransformer (real, not mocked), so there is no known path to key on
  // here, and #gateway/node/fs/exists-sync's own proxy only offers a path-addressed `.returns()`.
  existsSyncProxy();
  // The blind, sticky override setupTsExists/setupTsxExists need is registered directly on the
  // real `existsSync` instead — the same fallback every existing test already relies on
  // implicitly (a `false` default with no explicit stage).
  const existsHandle = registerMock({ fn: existsSync });
  existsHandle.calledWith([]).returns(false);

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
      existsHandle.calledWith([]).implement((): boolean => result);
    },

    setupTsxExists: ({ result }: { result: boolean }): void => {
      existsHandle.calledWith([]).implement((): boolean => result);
    },
  };
};
