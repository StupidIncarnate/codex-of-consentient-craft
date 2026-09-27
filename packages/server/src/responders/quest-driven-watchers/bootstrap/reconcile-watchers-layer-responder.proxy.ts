import { questListBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/list/quest-list-broker.proxy';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildId, GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const ReconcileWatchersLayerResponderProxy = (): {
  guildsProxy: {
    returns: (params: { guilds: GuildListItem[] }) => void;
    throws: (params: { error: Error }) => void;
  };
  questsProxy: {
    returns: (params: { guildId: GuildId; quests: Quest[] }) => void;
    throws: (params: { error: Error }) => void;
  };
  startWatcherProxy: {
    resolves: (params: { parentSessionId: string }) => void;
    throws: (params: { parentSessionId: string; error: Error }) => void;
    wasStopCalled: () => boolean;
    startedWithWorkerWorkItemId: (params: {
      parentSessionId: string;
      workerWorkItemId: string;
    }) => boolean;
    startedWithoutWorkerWorkItemId: (params: { parentSessionId: string }) => boolean;
    startedWithWorkerQuestId: (params: {
      parentSessionId: string;
      workerQuestId: string;
    }) => boolean;
    startedWithProjectDir: (params: { parentSessionId: string; projectDir: string }) => boolean;
  };
} => {
  const orchestrator = StartOrchestratorProxy();
  // The responder reads each guild's quests WHOLE — it needs their work items, and a summary
  // carries none. There is no second per-quest load to stage behind this one.
  const questListProxy = questListBrokerProxy();

  // No test in this responder's own colocated .test.ts asserts on a dev-log line — creating the
  // child proxy here only registers its mock, so the responder's real calls into
  // processDevLogAdapter resolve instead of hitting a real, unmocked I/O call.
  processDevLogAdapterProxy();

  return {
    guildsProxy: {
      returns: ({ guilds }: { guilds: GuildListItem[] }): void => {
        orchestrator.listGuildsReturns({ guilds });
      },
      throws: ({ error }: { error: Error }): void => {
        orchestrator.listGuildsThrows({ error });
      },
    },
    questsProxy: {
      returns: ({ guildId, quests }: { guildId: GuildId; quests: Quest[] }): void => {
        questListProxy.setupDirectList({ guildId, quests });
      },
      // No caller currently exercises this path with a specific guildId — questListBrokerProxy's
      // own failure scenario addresses by `[]`, same as before.
      throws: ({ error }: { error: Error }): void => {
        questListProxy.setupDirectListFailure({ error });
      },
    },
    startWatcherProxy: {
      resolves: ({ parentSessionId }: { parentSessionId: string }): void => {
        orchestrator.startMonitorWatcherResolves({ parentSessionId });
      },
      throws: ({ parentSessionId, error }: { parentSessionId: string; error: Error }): void => {
        orchestrator.startMonitorWatcherThrows({ parentSessionId, error });
      },
      wasStopCalled: (): boolean => orchestrator.startMonitorWatcherWasStopCalled(),
      startedWithWorkerWorkItemId: ({
        parentSessionId,
        workerWorkItemId,
      }: {
        parentSessionId: string;
        workerWorkItemId: string;
      }): boolean =>
        orchestrator.startMonitorWatcherStartedWithWorkerWorkItemId({
          parentSessionId,
          workerWorkItemId,
        }),
      startedWithoutWorkerWorkItemId: ({ parentSessionId }: { parentSessionId: string }): boolean =>
        orchestrator.startMonitorWatcherStartedWithoutWorkerWorkItemId({ parentSessionId }),
      startedWithWorkerQuestId: ({
        parentSessionId,
        workerQuestId,
      }: {
        parentSessionId: string;
        workerQuestId: string;
      }): boolean =>
        orchestrator.startMonitorWatcherStartedWithWorkerQuestId({
          parentSessionId,
          workerQuestId,
        }),
      startedWithProjectDir: ({
        parentSessionId,
        projectDir,
      }: {
        parentSessionId: string;
        projectDir: string;
      }): boolean =>
        orchestrator.startMonitorWatcherStartedWithProjectDir({ parentSessionId, projectDir }),
    },
  };
};
