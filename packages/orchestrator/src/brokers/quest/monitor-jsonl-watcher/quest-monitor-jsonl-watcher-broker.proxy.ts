import type { FileName } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';

import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

export const questMonitorJsonlWatcherBrokerProxy = (): {
  setupSubagentDirEmpty: () => void;
  setupSubagentDirMissing: (params: { error: Error }) => void;
  setupSubagentDirFiles: (params: { files: readonly FileName[] }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
} => {
  claudeLineNormalizeBrokerProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  // `startSubagentTailLayerBrokerProxy()` and `fsWatchTailAdapterProxy()` both end up
  // registering against the same registerMock callerPath (`fs-watch-tail-adapter`). The
  // LAST mockImplementation call wins on jest's mock — so the parent's direct
  // `fsWatchTailAdapterProxy()` (below) takes ownership of the queue + watch callbacks
  // for every `fsWatchTailAdapter` invocation in this test, including the ones the layer
  // broker makes for sub-agent tails. The layer proxy is still instantiated to satisfy
  // `enforce-proxy-child-creation` (the parent broker imports `startSubagentTailLayerBroker`).
  startSubagentTailLayerBrokerProxy();
  const tailProxy = fsWatchTailAdapterProxy();

  return {
    setupSubagentDirEmpty: (): void => {
      readdirProxy.returns({ files: [] });
    },
    setupSubagentDirMissing: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ error });
    },
    setupSubagentDirFiles: ({ files }: { files: readonly FileName[] }): void => {
      readdirProxy.returns({ files: [...files] });
    },
    // Lines are dispensed FIFO across every watcher this broker creates. Watchers are
    // registered in this order: each pre-existing subagent JSONL (in `fsReaddirAdapter`
    // return order), then the main JSONL. The first `triggerChange()` fires each watcher
    // callback once in registration order; each callback shifts one batch off the queue.
    // Queue batches accordingly: subagent batches first, then main, then any post-change
    // appends in the same order on subsequent `triggerChange()` calls.
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      tailProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      tailProxy.triggerChange();
    },
  };
};
