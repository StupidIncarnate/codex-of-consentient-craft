import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readFileContentsLayerBrokerProxy = (): {
  setupReturns: ({
    filePath,
    content,
  }: {
    filePath: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissing: ({ filePath }: { filePath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();
  const handle = registerMock({ fn: readFileSync });
  // Composing proxies elsewhere in this package instantiate several sibling proxies over this
  // same fs mock purely so their code paths don't crash on files their own test never describes.
  // This blind, lowest-specificity fallback keeps that working: a path-specific setupReturns/
  // setupMissing (routed through the gateway's own proxy) always outranks it.
  handle.calledWith([]).returns('' as never);

  return {
    setupReturns: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      gatewayProxy.returns({ path: filePath, contents: content });
    },

    setupMissing: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      gatewayProxy.throws({ path: filePath, error: new Error('ENOENT') });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      handle.calledWith([]).implement(fn as never);
    },
  };
};
