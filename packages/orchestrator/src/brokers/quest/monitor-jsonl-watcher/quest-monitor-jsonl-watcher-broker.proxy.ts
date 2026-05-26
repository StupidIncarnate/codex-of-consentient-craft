import type { FileName } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';

import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';
import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';

import { scanSubagentsDirLayerBrokerProxy } from './scan-subagents-dir-layer-broker.proxy';
import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

export const questMonitorJsonlWatcherBrokerProxy = (): {
  setupSubagentDirEmpty: () => void;
  setupSubagentDirMissing: (params: { error: Error }) => void;
  setupSubagentDirFiles: (params: { files: readonly FileName[] }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
  triggerPollTick: () => void;
} => {
  claudeLineNormalizeBrokerProxy();
  // `startSubagentTailLayerBrokerProxy()`, `scanSubagentsDirLayerBrokerProxy()`, and
  // `fsWatchTailAdapterProxy()` all end up registering against the same registerMock
  // callerPath for `fsWatchTailAdapter`. The LAST mockImplementation call wins on jest's
  // mock — so the parent's direct `fsWatchTailAdapterProxy()` (below) takes ownership of
  // the queue + watch callbacks for every `fsWatchTailAdapter` invocation in this test,
  // including the ones the layer brokers make for sub-agent tails. The layer proxies are
  // still instantiated to satisfy `enforce-proxy-child-creation` (the parent broker
  // imports the layers directly). `scanLayerProxy` is captured so the parent's
  // `setupSubagentDir*` helpers can forward into its semantic methods — the parent broker
  // no longer calls `fsReaddirAdapter` directly (the layer broker owns that path).
  startSubagentTailLayerBrokerProxy();
  const scanLayerProxy = scanSubagentsDirLayerBrokerProxy();
  const tailProxy = fsWatchTailAdapterProxy();
  const intervalProxy = timerSetIntervalAdapterProxy();

  return {
    setupSubagentDirEmpty: (): void => {
      scanLayerProxy.setupSubagentDirFiles({ files: [] });
    },
    setupSubagentDirMissing: ({ error }: { error: Error }): void => {
      scanLayerProxy.setupSubagentDirMissing({ error });
    },
    setupSubagentDirFiles: ({ files }: { files: readonly FileName[] }): void => {
      scanLayerProxy.setupSubagentDirFiles({ files });
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
    // Fires the periodic poll-rescan registered with `timerSetIntervalAdapter`. The
    // broker uses this poll to discover sub-agent JSONL files that appear AFTER the
    // initial readdir scan but BEFORE the parent emits the user.tool_result line that
    // produces the `agent-detected` signal (mid-flight sub-agent dispatch).
    triggerPollTick: (): void => {
      intervalProxy.triggerTick();
    },
  };
};
