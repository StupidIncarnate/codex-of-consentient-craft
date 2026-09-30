import { homedir } from '#gateway/node/os';
import { absoluteFilePathContract, type AbsoluteFilePath, type FileName, sessionContract } from '@dungeonmaster/shared/contracts';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questMonitorJsonlWatcherBrokerProxy } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.proxy';
import { questOrphanResetBrokerProxy } from '../orphan-reset/quest-orphan-reset-broker.proxy';

export const questMonitorWatcherStartBrokerProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
  // homeDir/projectDir/parentSessionId must match the values the test's own
  // questMonitorWatcherStartBroker call uses — the real broker derives subagentsDir from
  // these via claudeProjectPathEncoderTransformer, and questMonitorJsonlWatcherBrokerProxy's
  // own default subagentsDir is a DIFFERENT hardcoded path that only matches that file's own
  // test suite. Passing the real values here keeps the readdir staging addressed correctly.
  setupSubagentDirFiles: (params: {
    homeDir: string;
    projectDir: string;
    parentSessionId: string;
    files: readonly FileName[];
  }) => void;
  // homeDir/projectDir/parentSessionId of the three methods below must match the values the
  // test's own questMonitorWatcherStartBroker call uses — the real broker derives every tailed
  // path from them. `setupSessionFile` stages the worker session's main JSONL: the tail opens it
  // as the broker starts and drains its lines once, so all three are called BEFORE the broker.
  setupSessionFile: (params: {
    homeDir: string;
    projectDir: string;
    parentSessionId: string;
  }) => void;
  setupLines: (params: {
    homeDir: string;
    projectDir: string;
    parentSessionId: string;
    lines: readonly string[];
  }) => void;
  // Stages one sub-agent JSONL under the session's `subagents/` directory, drained once when its
  // tail starts.
  setupSubagentLines: (params: {
    homeDir: string;
    projectDir: string;
    parentSessionId: string;
    fileName: FileName;
    lines: readonly string[];
  }) => void;
  // Queues the content the scan reads as a not-yet-paired sub-agent file's FIRST line —
  // the byte-equal prompt-pairing key. Targets the single file most recently staged via
  // `setupSubagentDirFiles`.
  setupFirstLineRead: (params: { content: string }) => void;
  // Fires the periodic poll-rescan registered with `timerIntervalStartBroker` — the retry
  // that lets a sub-agent file pair once the main tail has since drained its spawning
  // Task line.
  triggerPollTick: () => void;
} => {
  const homedirHandle = registerMock({ fn: homedir });
  const orphanResetProxy = questOrphanResetBrokerProxy();
  // Default: no guilds — orphan reset returns 0 without touching the fs chain.
  orphanResetProxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });
  (guildListBroker as jest.MockedFunction<typeof guildListBroker>).mockResolvedValue([]);

  const jsonlWatcherProxy = questMonitorJsonlWatcherBrokerProxy();
  const sessionFilePathOf = ({
    homeDir,
    projectDir,
    parentSessionId,
  }: {
    homeDir: string;
    projectDir: string;
    parentSessionId: string;
  }): AbsoluteFilePath =>
    claudeProjectPathEncoderTransformer({
      homeDir: absoluteFilePathContract.parse(homeDir),
      projectPath: absoluteFilePathContract.parse(projectDir),
      sessionId: sessionContract.shape.id.parse(parentSessionId),
    });
  // No pre-queued subagent-dir state — the underlying readdir mock defaults to `[]`
  // so the watcher scans no subagent files unless a test calls
  // `setupSubagentDirFiles({...})`. Auto-queueing a throw here would shadow that fallback
  // and tests that need a populated dir would never see their `returns` take effect.

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirHandle.calledWith([]).returns(path);
    },
    setupSubagentDirFiles: ({
      homeDir,
      projectDir,
      parentSessionId,
      files,
    }: {
      homeDir: string;
      projectDir: string;
      parentSessionId: string;
      files: readonly FileName[];
    }): void => {
      const sessionFilePath = claudeProjectPathEncoderTransformer({
        homeDir: absoluteFilePathContract.parse(homeDir),
        projectPath: absoluteFilePathContract.parse(projectDir),
        sessionId: sessionContract.shape.id.parse(parentSessionId),
      });
      const subagentsDir = absoluteFilePathContract.parse(
        `${stripJsonlSuffixTransformer({ filePath: sessionFilePath })}/subagents`,
      );
      jsonlWatcherProxy.setupSubagentDirFiles({ subagentsDir, files });
    },
    setupSessionFile: ({
      homeDir,
      projectDir,
      parentSessionId,
    }: {
      homeDir: string;
      projectDir: string;
      parentSessionId: string;
    }): void => {
      jsonlWatcherProxy.setupFile({
        path: sessionFilePathOf({ homeDir, projectDir, parentSessionId }),
      });
    },
    setupLines: ({
      homeDir,
      projectDir,
      parentSessionId,
      lines,
    }: {
      homeDir: string;
      projectDir: string;
      parentSessionId: string;
      lines: readonly string[];
    }): void => {
      jsonlWatcherProxy.setupLines({
        path: sessionFilePathOf({ homeDir, projectDir, parentSessionId }),
        lines,
      });
    },
    setupSubagentLines: ({
      homeDir,
      projectDir,
      parentSessionId,
      fileName,
      lines,
    }: {
      homeDir: string;
      projectDir: string;
      parentSessionId: string;
      fileName: FileName;
      lines: readonly string[];
    }): void => {
      jsonlWatcherProxy.setupLines({
        path: `${stripJsonlSuffixTransformer({
          filePath: sessionFilePathOf({ homeDir, projectDir, parentSessionId }),
        })}/subagents/${String(fileName)}`,
        lines,
      });
    },
    setupFirstLineRead: ({ content }: { content: string }): void => {
      jsonlWatcherProxy.setupFirstLineRead({ content });
    },
    triggerPollTick: (): void => {
      jsonlWatcherProxy.triggerPollTick();
    },
  };
};
