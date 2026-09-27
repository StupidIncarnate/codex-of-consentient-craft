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
  const handle = registerMock({ fn: readFileSync });
  // Composing proxies elsewhere in this package instantiate several sibling proxies over this
  // same fs mock purely so their code paths don't crash on files their own test never describes.
  // This blind, lowest-specificity fallback keeps that working: a path-specific setupReturns/
  // setupMissing (routed through the gateway's own proxy) always outranks it. Kept on the raw,
  // 0-arg handle rather than the gateway's returnsMatchingPath: that method always addresses both
  // real args (`[path, 'utf8']`), which scores higher than this 0-arg registration and would
  // permanently outrank setupImplementation's own 0-arg registration below regardless of call
  // order — setupImplementation's computed, per-path virtual-tree responses (used across this
  // package, e.g. bus-emitter-sites-find-layer-broker.proxy.ts) depend on winning that tie by
  // being staged later, not by scoring higher.
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
