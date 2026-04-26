import { Hono } from 'hono';
import type { QuestListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';
import type { OrchestrationEventType, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import {
  pathJoinAdapterProxy,
  portResolveBrokerProxy,
  locationsWardResultsPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

// Preserve real orchestrator exports (contracts, types) while mocking functions used by adapters
registerModuleMock({
  module: '@dungeonmaster/orchestrator',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/orchestrator'),
    StartOrchestrator: {
      addGuild: jest.fn(),
      addQuest: jest.fn(),
      browseDirectories: jest.fn(),
      getGuild: jest.fn(),
      getQuest: jest.fn(),
      getQuestStatus: jest.fn(),
      listGuilds: jest.fn(),
      listQuests: jest.fn(),
      loadQuest: jest.fn(),
      modifyQuest: jest.fn(),
      pauseQuest: jest.fn(),
      abandonQuest: jest.fn(),
      recoverActiveQuests: jest.fn(),
      removeGuild: jest.fn(),
      replayChatHistory: jest.fn(),
      setWebPresence: jest.fn(),
      startChat: jest.fn(),
      startDesignChat: jest.fn(),
      startQuest: jest.fn(),
      stopAllChats: jest.fn(),
      stopChat: jest.fn(),
      updateGuild: jest.fn(),
    },
    orchestrationEventsState: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
    },
    questFindQuestPathBroker: jest.fn(),
  }),
});

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { honoCreateNodeWebSocketAdapterProxy } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { honoServeAdapterProxy } from '../../../adapters/hono/serve/hono-serve-adapter.proxy';
import { orchestratorEventsOnAdapterProxy } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { orchestratorOutboxWatchAdapterProxy } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter.proxy';
import { orchestratorReplayChatHistoryAdapterProxy } from '../../../adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter.proxy';
import { orchestratorSetWebPresenceAdapterProxy } from '../../../adapters/orchestrator/set-web-presence/orchestrator-set-web-presence-adapter.proxy';
import { orchestratorStopAllChatsAdapterProxy } from '../../../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { designProcessStateProxy } from '../../../state/design-process/design-process-state.proxy';
import { ServerInitResponder } from './server-init-responder';

type Quest = ReturnType<typeof QuestStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type EventHandler = (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;

export const ServerInitResponderProxy = (): {
  callResponder: () => void;
  simulateConnection: (params: { client: WsClient }) => void;
  simulateMessage: (params: { data: string; ws: WsClient }) => void;
  simulateDisconnect: (params: { ws: WsClient }) => void;
  setupLoadQuestSuccess: (params: { quest: Quest }) => void;
  setupLoadQuestFailure: (params: { error: Error }) => void;
  setupListQuestsSuccess: (params: { quests: QuestListItem[] }) => void;
  setupListQuestsFailure: (params: { error: Error }) => void;
  setupReplaySuccess: () => void;
  setupReplayFailure: (params: { error: Error }) => void;
  enableDevLogs: () => void;
  getDevLogOutput: () => SpyOnHandle;
  getCapturedEventHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
  getOutboxWatchCallbacks: () => {
    onQuestChanged: ((args: { questId: QuestId }) => void) | undefined;
    onError: ((args: { error: unknown }) => void) | undefined;
  };
  getSetWebPresenceCalls: () => unknown[];
} => {
  const dateSpy = registerSpyOn({
    object: Date.prototype,
    method: 'toISOString',
    passthrough: true,
  });
  dateSpy.mockReturnValue('2024-01-01T00:00:00.000Z');
  const wsProxy = honoCreateNodeWebSocketAdapterProxy();
  honoServeAdapterProxy();
  const eventsOnProxy = orchestratorEventsOnAdapterProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const loadQuestProxy = orchestratorLoadQuestAdapterProxy();
  const replayProxy = orchestratorReplayChatHistoryAdapterProxy();
  const outboxWatchProxy = orchestratorOutboxWatchAdapterProxy();
  const setWebPresenceProxy = orchestratorSetWebPresenceAdapterProxy();
  orchestratorStopAllChatsAdapterProxy();
  const devLogProxy = processDevLogAdapterProxy();
  pathJoinAdapterProxy();
  locationsWardResultsPathFindBrokerProxy();
  fsReadFileAdapterProxy();
  orchestratorFindQuestPathAdapterProxy();
  wsEventRelayBroadcastBrokerProxy();
  designProcessStateProxy();
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: '3737' });

  return {
    callResponder: (): void => {
      // Clean up leftover signal handlers from previous tests to prevent listener leaks.
      // Each test creates a new ServerInitResponder that registers SIGTERM/SIGINT handlers.
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
      ServerInitResponder({ app: new Hono() });
    },
    simulateConnection: ({ client }: { client: WsClient }): void => {
      wsProxy.simulateConnection({ client });
    },
    simulateMessage: ({ data, ws }: { data: string; ws: WsClient }): void => {
      wsProxy.simulateMessage({ data, ws });
    },
    simulateDisconnect: ({ ws }: { ws: WsClient }): void => {
      wsProxy.simulateDisconnect({ ws });
    },
    setupLoadQuestSuccess: ({ quest }: { quest: Quest }): void => {
      loadQuestProxy.returns({ quest });
    },
    setupLoadQuestFailure: ({ error }: { error: Error }): void => {
      loadQuestProxy.throws({ error });
    },
    setupListQuestsSuccess: ({ quests }: { quests: QuestListItem[] }): void => {
      listQuestsProxy.returns({ quests });
    },
    setupListQuestsFailure: ({ error }: { error: Error }): void => {
      listQuestsProxy.throws({ error });
    },
    setupReplaySuccess: (): void => {
      replayProxy.setupSuccess();
    },
    setupReplayFailure: ({ error }: { error: Error }): void => {
      replayProxy.setupFailure({ error });
    },
    getCapturedEventHandler: ({
      type,
    }: {
      type: OrchestrationEventType;
    }): EventHandler | undefined => eventsOnProxy.getCapturedHandler({ type }),
    getOutboxWatchCallbacks: (): {
      onQuestChanged: ((args: { questId: QuestId }) => void) | undefined;
      onError: ((args: { error: unknown }) => void) | undefined;
    } => outboxWatchProxy.getCapturedCallbacks(),
    enableDevLogs: (): void => {
      devLogProxy.enableVerbose();
    },
    getDevLogOutput: (): SpyOnHandle => devLogProxy.getWrittenLines(),
    getSetWebPresenceCalls: (): unknown[] => setWebPresenceProxy.getAllCalledArgs(),
  };
};
