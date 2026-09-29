import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { FileNameStub, absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';
import { stripJsonlSuffixTransformer } from '@dungeonmaster/shared/transformers';

type FileName = ReturnType<typeof FileNameStub>;

import { tailFileProxy } from '#gateway/node/fs/tail-file/tail-file.proxy';

import { timerIntervalStartBrokerProxy } from '../../timer/interval-start/timer-interval-start-broker.proxy';
import { questGetServerConfigBrokerProxy } from '../get-server-config/quest-get-server-config-broker.proxy';
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
  setupFile: (params: { path: string }) => void;
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
  triggerChange: (params: { path: string }) => void;
  triggerPollTick: () => void;
  setPort: (params: { value: string }) => void;
} => {
  stderrProxy();
  claudeLineNormalizeBrokerProxy();
  // The broker now resolves the server's port via questGetServerConfigBroker to build the
  // serverBaseUrl it hands to chatLineProcessTransformer. Stage a port BEFORE any test runs —
  // without it, portResolveBroker falls through to processCwdAdapter() and an fs walk for
  // .dungeonmaster.json, and this suite's fs mock throws on unmatched calls, turning every
  // test in this file red. `setPort` is exposed so a test can pin a different port.
  const serverConfigProxy = questGetServerConfigBrokerProxy();
  serverConfigProxy.setPort({ value: '3737' });
  // The layer proxies are instantiated to satisfy `enforce-proxy-child-creation` (the parent
  // broker imports the layers directly). Every tail this broker starts — the main session file
  // and each sub-agent file — is staged through this proxy's own `tailFileProxy`, addressed by
  // that file's path. `scanLayerProxy` is captured so the parent's `setupSubagentDir*` helpers
  // can forward into its semantic methods.
  startSubagentTailLayerBrokerProxy();
  const scanLayerProxy = scanSubagentsDirLayerBrokerProxy();
  const tailProxy = tailFileProxy();
  // Mirrors the broker's own SUBAGENT_DIR_POLL_INTERVAL_MS constant (1000ms) — not exported,
  // so this address is duplicated here rather than imported.
  const intervalProxy = timerIntervalStartBrokerProxy({ intervalMs: 1000 });
  // The single file (and its dir) most recently staged via setupSubagentDirFiles — every
  // test that later calls setupFirstLineRead staged exactly one file immediately before it,
  // so this is the real fileName + subagentsDir the broker's prompt-pairing read targets.
  const lastStagedFileNamesRef: { value: readonly FileName[] } = { value: [] };
  const lastStagedSubagentsDirRef: { value: AbsoluteFilePath } = { value: DEFAULT_SUBAGENTS_DIR };

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
      lastStagedSubagentsDirRef.value = subagentsDir ?? DEFAULT_SUBAGENTS_DIR;
      scanLayerProxy.setupSubagentDirFiles({
        subagentsDir: subagentsDir ?? DEFAULT_SUBAGENTS_DIR,
        files,
      });
    },
    // Queues the content the scan reads as a not-yet-paired sub-agent file's FIRST line.
    // Claude CLI writes the spawning Task's `input.prompt` verbatim there, so this is what
    // the prompt-pairing path matches against the processor's outstanding Tasks. Targets
    // the dir most recently staged via setupSubagentDirFiles, so a composing proxy driving
    // a non-default projectDir/parentSessionId still addresses the real computed path.
    setupFirstLineRead: ({ content }: { content: string }): void => {
      const [fileName] = lastStagedFileNamesRef.value;
      scanLayerProxy.setupFirstLineRead({
        subagentsDir: lastStagedSubagentsDirRef.value,
        fileName: fileName ?? FileNameStub({ value: 'agent-unset.jsonl' }),
        content,
      });
    },
    setupFile: ({ path }: { path: string }): void => {
      tailProxy.setupFile({ path });
    },
    // Stages one drain's worth of lines for the file at `path`. The tail drains once as it starts,
    // so a file's first batch is staged BEFORE its tail exists; `triggerChange` runs a later drain.
    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      tailProxy.setupLines({ path, lines });
    },
    triggerChange: ({ path }: { path: string }): void => {
      tailProxy.triggerChange({ path });
    },
    // Fires the periodic poll-rescan registered with `timerIntervalStartBroker`. The
    // broker uses this poll to discover sub-agent JSONL files that appear AFTER the
    // initial readdir scan but BEFORE the parent emits the user.tool_result line that
    // produces the `agent-detected` signal (mid-flight sub-agent dispatch).
    triggerPollTick: (): void => {
      intervalProxy.triggerTick();
    },
    setPort: serverConfigProxy.setPort,
  };
};
