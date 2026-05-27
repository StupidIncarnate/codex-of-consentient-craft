import type { FileName } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

export const scanSubagentsDirLayerBrokerProxy = (): {
  setupSubagentDirFiles: (params: { files: readonly FileName[] }) => void;
  setupSubagentDirMissing: (params: { error: Error }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  // Same registerMock collision rationale as `quest-monitor-jsonl-watcher-broker.proxy.ts`
  // — the LAST mockImplementation on `fsWatchTailAdapter` wins, so the parent's own tail
  // proxy takes ownership when this layer is composed inside it. The child proxy also
  // sets up `claudeLineNormalizeBrokerProxy` via its own composition chain.
  startSubagentTailLayerBrokerProxy();
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupSubagentDirFiles: ({ files }: { files: readonly FileName[] }): void => {
      readdirProxy.returns({ files: [...files] });
    },
    setupSubagentDirMissing: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ error });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
