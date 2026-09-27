import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readFileLayerBrokerProxy = (): {
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
  // A 0-arg raw registration, not the gateway's own returnsMatchingPath: that method always
  // addresses both real args ([path, 'utf8']), which scores higher than a 0-arg registration and
  // would permanently outrank setupImplementation's own 0-arg registration below regardless of
  // call order — setupImplementation's own fn depends on winning that tie by being staged later.
  const handle = registerMock({ fn: readFileSync });

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
