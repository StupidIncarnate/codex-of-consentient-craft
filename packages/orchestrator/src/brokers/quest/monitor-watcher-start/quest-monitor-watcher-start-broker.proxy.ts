import type { FileName } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';

import { questModifyBroker } from '../modify/quest-modify-broker';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questMonitorJsonlWatcherBrokerProxy } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.proxy';
import { questOrphanResetBrokerProxy } from '../orphan-reset/quest-orphan-reset-broker.proxy';

type QuestModifyCall = Parameters<typeof questModifyBroker>[0];

export const questMonitorWatcherStartBrokerProxy = (): {
  setupHomeDir: (params: { path: string }) => void;
  setupSubagentDirFiles: (params: { files: readonly FileName[] }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
  getQuestModifyCalls: () => readonly QuestModifyCall[];
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const orphanResetProxy = questOrphanResetBrokerProxy();
  // Default: no guilds — orphan reset returns 0 without touching the fs chain.
  orphanResetProxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });

  const jsonlWatcherProxy = questMonitorJsonlWatcherBrokerProxy();
  // No pre-queued subagent-dir state — the underlying readdir mock defaults to `[]`
  // so the watcher scans no subagent files unless a test calls
  // `setupSubagentDirFiles({...})`. Auto-queueing a throw here would shadow that fallback
  // and tests that need a populated dir would never see their `returns` take effect.

  // Register so the broker's `questModifyBroker` import is a global mock; tests assert on
  // `getQuestModifyCalls()` to inspect the workItems payload the watcher emitted.
  questModifyBrokerProxy();

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
    setupSubagentDirFiles: ({ files }: { files: readonly FileName[] }): void => {
      jsonlWatcherProxy.setupSubagentDirFiles({ files });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      jsonlWatcherProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      jsonlWatcherProxy.triggerChange();
    },
    getQuestModifyCalls: (): readonly QuestModifyCall[] => {
      const mocked = questModifyBroker as jest.MockedFunction<typeof questModifyBroker>;
      return mocked.mock.calls.map((call) => call[0]);
    },
  };
};
