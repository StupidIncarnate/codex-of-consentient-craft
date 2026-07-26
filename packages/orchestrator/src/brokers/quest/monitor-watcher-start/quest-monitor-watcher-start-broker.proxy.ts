import {
  absoluteFilePathContract,
  GuildIdStub,
  GuildListItemStub,
  QuestStub,
  sessionIdContract,
  WorkItemStub,
  type FileName,
  type QuestId,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  claudeProjectPathEncoderTransformer,
  stripJsonlSuffixTransformer,
} from '@dungeonmaster/shared/transformers';

import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';
import type { AgentId } from '../../../contracts/agent-id/agent-id-contract';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';
import { questMonitorJsonlWatcherBrokerProxy } from '../monitor-jsonl-watcher/quest-monitor-jsonl-watcher-broker.proxy';
import { questOrphanResetBrokerProxy } from '../orphan-reset/quest-orphan-reset-broker.proxy';

import { refreshActiveAgentIdsLayerBrokerProxy } from './refresh-active-agent-ids-layer-broker.proxy';

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
  setupLines: (params: { lines: readonly string[] }) => void;
  setupActiveQuest: (params: { questId: QuestId; agentIds: readonly AgentId[] }) => void;
  triggerChange: () => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const orphanResetProxy = questOrphanResetBrokerProxy();
  // Default: no guilds — orphan reset returns 0 without touching the fs chain.
  orphanResetProxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });
  // refreshActiveAgentIdsLayerBroker also calls guildListBroker (separately from
  // orphan-reset). Override the mock with a permanent empty-array default so every
  // subsequent call short-circuits without touching the real fs chain. Tests that need
  // an active quest with agentIds override this via the broker's own seams.
  refreshActiveAgentIdsLayerBrokerProxy();
  (guildListBroker as jest.MockedFunction<typeof guildListBroker>).mockResolvedValue([]);

  // The watcher-start broker also creates its own setInterval for the periodic
  // active-agentIds refresh, at the SAME 1000ms delay as the jsonl-watcher's poll-rescan
  // below. registerSpyOn dispatch keys on (predicate, intervalMs) globally, so the single
  // 1000ms registration answers both real setInterval calls this broker makes regardless of
  // which proxy file registers it — still instantiated directly here (not just via the
  // jsonl-watcher child) so enforce-proxy-child-creation sees this file's own
  // timerSetIntervalAdapter import mirrored by its proxy.
  timerSetIntervalAdapterProxy({ intervalMs: 1000 });
  const jsonlWatcherProxy = questMonitorJsonlWatcherBrokerProxy();
  // No pre-queued subagent-dir state — the underlying readdir mock defaults to `[]`
  // so the watcher scans no subagent files unless a test calls
  // `setupSubagentDirFiles({...})`. Auto-queueing a throw here would shadow that fallback
  // and tests that need a populated dir would never see their `returns` take effect.

  return {
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
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
        sessionId: sessionIdContract.parse(parentSessionId),
      });
      const subagentsDir = absoluteFilePathContract.parse(
        `${stripJsonlSuffixTransformer({ filePath: sessionFilePath })}/subagents`,
      );
      jsonlWatcherProxy.setupSubagentDirFiles({ subagentsDir, files });
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      jsonlWatcherProxy.setupLines({ lines });
    },
    setupActiveQuest: ({
      questId,
      agentIds,
    }: {
      questId: QuestId;
      agentIds: readonly AgentId[];
    }): void => {
      // Override the default empty-guilds mock with a single guild whose only quest
      // carries in_progress work items stamped with the supplied agentIds. Used by
      // tests that need the watcher's `isAgentIdActive` predicate to admit specific
      // realAgentIds (otherwise the new quest-driven filter rejects every file).
      const guildId = GuildIdStub({ value: '11111111-aaaa-bbbb-cccc-111111111111' });
      (guildListBroker as jest.MockedFunction<typeof guildListBroker>).mockResolvedValue([
        GuildListItemStub({ id: guildId, valid: true }),
      ]);
      const workItems = agentIds.map((agentId) =>
        WorkItemStub({
          status: 'in_progress',
          agentId,
        }),
      );
      (questListBroker as jest.MockedFunction<typeof questListBroker>).mockResolvedValue([
        QuestStub({
          id: questId,
          status: 'in_progress',
          workItems,
        }),
      ]);
    },
    triggerChange: (): void => {
      jsonlWatcherProxy.triggerChange();
    },
  };
};
