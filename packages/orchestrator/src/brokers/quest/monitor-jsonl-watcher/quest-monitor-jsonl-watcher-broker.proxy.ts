import { FileNameStub, absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

type FileName = ReturnType<typeof FileNameStub>;

import { fsWatchTailAdapterProxy } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter.proxy';
import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';

import { scanSubagentsDirLayerBrokerProxy } from './scan-subagents-dir-layer-broker.proxy';
import { startSubagentTailLayerBrokerProxy } from './start-subagent-tail-layer-broker.proxy';

// The broker derives subagentsDir from sessionFilePath (strip '.jsonl', append '/subagents')
// via the same real stripJsonlSuffixTransformer used here. Every test in this file's suite
// but one uses this literal sessionFilePath, so it is the correct default subagentsDir for
// setupSubagentDirEmpty/Files/FirstLineRead. The one test with a different sessionFilePath
// (the ENOENT case) calls setupSubagentDirMissing directly with its own sessionFilePath.
const resolveSubagentsDir = ({ sessionFilePath }: { sessionFilePath: string }): AbsoluteFilePath =>
  absoluteFilePathContract.parse(
    `${stripJsonlSuffixTransformer({ filePath: absoluteFilePathContract.parse(sessionFilePath) })}/subagents`,
  );

const DEFAULT_SUBAGENTS_DIR = resolveSubagentsDir({
  sessionFilePath: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
});

export const questMonitorJsonlWatcherBrokerProxy = (): {
  setupSubagentDirEmpty: () => void;
  setupSubagentDirMissing: (params: { sessionFilePath: FilePath; error: Error }) => void;
  setupSubagentDirFiles: (params: {
    files: readonly FileName[];
    // Overrides DEFAULT_SUBAGENTS_DIR for callers whose real sessionFilePath (hence
    // derived subagentsDir) doesn't match this file's own hardcoded default — e.g. a
    // composing proxy (questMonitorWatcherStartBrokerProxy) whose test drives a
    // different projectDir/parentSessionId. Omit to use the default, matching every
    // test in THIS file's own suite.
    subagentsDir?: AbsoluteFilePath;
  }) => void;
  setupFirstLineRead: (params: { content: string }) => void;
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
  // Mirrors the broker's own SUBAGENT_DIR_POLL_INTERVAL_MS constant (1000ms) — not exported,
  // so this address is duplicated here rather than imported.
  const intervalProxy = timerSetIntervalAdapterProxy({ intervalMs: 1000 });
  // The single file most recently staged via setupSubagentDirFiles — every test that later
  // calls setupFirstLineRead staged exactly one file immediately before it, so this is the
  // real fileName the broker's prompt-pairing read targets.
  const lastStagedFileNamesRef: { value: readonly FileName[] } = { value: [] };

  return {
    setupSubagentDirEmpty: (): void => {
      scanLayerProxy.setupSubagentDirEmpty({ subagentsDir: DEFAULT_SUBAGENTS_DIR });
    },
    setupSubagentDirMissing: ({
      sessionFilePath,
      error,
    }: {
      sessionFilePath: FilePath;
      error: Error;
    }): void => {
      scanLayerProxy.setupSubagentDirMissing({
        subagentsDir: resolveSubagentsDir({ sessionFilePath: String(sessionFilePath) }),
        error,
      });
    },
    setupSubagentDirFiles: ({
      files,
      subagentsDir,
    }: {
      files: readonly FileName[];
      subagentsDir?: AbsoluteFilePath;
    }): void => {
      lastStagedFileNamesRef.value = files;
      scanLayerProxy.setupSubagentDirFiles({
        subagentsDir: subagentsDir ?? DEFAULT_SUBAGENTS_DIR,
        files,
      });
    },
    // Queues the content the scan reads as a non-active sub-agent file's FIRST line. Claude
    // CLI writes the spawning Task's `input.prompt` verbatim there, so this is what the
    // prompt-pairing path matches against the processor's outstanding Tasks.
    setupFirstLineRead: ({ content }: { content: string }): void => {
      const [fileName] = lastStagedFileNamesRef.value;
      scanLayerProxy.setupFirstLineRead({
        subagentsDir: DEFAULT_SUBAGENTS_DIR,
        fileName: fileName ?? FileNameStub({ value: 'agent-unset.jsonl' }),
        content,
      });
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
