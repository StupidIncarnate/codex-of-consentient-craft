import { Hono } from 'hono';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileContents,
  GuildId,
  OrchestrationEventType,
  ProcessId,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import {
  pathJoinAdapterProxy,
  portResolveBrokerProxy,
  locationsWardResultsPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// Named explicitly rather than spread from jest.requireActual: this responder's whole
// dependent tree only ever reaches four exports off '@dungeonmaster/orchestrator' —
// StartOrchestrator (loadQuest, replayChatHistory, stopAllChats, findQuestByWorkItemId — the
// methods this tree's adapters actually call; orchestratorOutboxWatchAdapter mocks its own
// local adapter module instead, so questOutboxWatchBroker never needs to be supplied here),
// orchestrationEventsState.on, and questFindQuestPathBroker.
// isoTimestampContract is the one export that must stay CALLABLE (server's own
// contracts/iso-timestamp/iso-timestamp-contract.ts re-exports it verbatim, and this responder
// calls `.parse()` on it for every WS envelope, always with a string already produced by
// `Date.prototype.toISOString()`). A real zod schema is not needed to make that call safe:
// every downstream consumer of the parsed value (wsMessageContract) carries its OWN independent
// `z.string().datetime().brand<'IsoTimestamp'>()` check rather than reusing this export, so an
// identity `parse` that hands the already-valid value back is behaviorally exact — generic
// rather than typed `string` so it stays off ban-primitives — and it sidesteps pulling in zod
// (or the orchestrator barrel) through this factory at all.
registerModuleMock({
  module: '@dungeonmaster/orchestrator',
  factory: () => ({
    isoTimestampContract: { parse: <T>(value: T): T => value },
    StartOrchestrator: {
      loadQuest: jest.fn(),
      replayChatHistory: jest.fn(),
      stopAllChats: jest.fn(),
      findQuestByWorkItemId: jest.fn(),
    },
    orchestrationEventsState: {
      on: jest.fn(),
    },
    questFindQuestPathBroker: jest.fn(),
  }),
});

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { orchestratorFindQuestByWorkItemIdAdapterProxy } from '../../../adapters/orchestrator/find-quest-by-work-item-id/orchestrator-find-quest-by-work-item-id-adapter.proxy';
import { orchestratorFindQuestPathAdapterProxy } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter.proxy';
import { honoCreateNodeWebSocketAdapterProxy } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { honoServeAdapterProxy } from '../../../adapters/hono/serve/hono-serve-adapter.proxy';
import { orchestratorEventsOnAdapterProxy } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { orchestratorOutboxWatchAdapterProxy } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter.proxy';
import { orchestratorReplayChatHistoryAdapterProxy } from '../../../adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter.proxy';
import { orchestratorStopAllChatsAdapterProxy } from '../../../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter.proxy';
import { questWaitForSessionStampBrokerProxy } from '../../../brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.proxy';
import { webBundleResponseBrokerProxy } from '../../../brokers/web-bundle/response/web-bundle-response-broker.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { designProcessStateProxy } from '../../../state/design-process/design-process-state.proxy';
import { ServerInitResponder } from './server-init-responder';

type Quest = ReturnType<typeof QuestStub>;
type EventHandler = (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;

export const ServerInitResponderProxy = (): {
  callResponder: (params?: { serveWebBundle?: boolean }) => void;
  dispatchRequest: (params: { url: string; method?: string }) => Promise<Response>;
  setServerPort: (params: { value: string }) => void;
  setupWebBundleFile: (params: { contents: FileContents }) => void;
  simulateConnection: (params: { client: WsClient }) => void;
  simulateMessage: (params: { data: string; ws: WsClient }) => void;
  simulateDisconnect: (params: { ws: WsClient }) => void;
  setupLoadQuestSuccess: (params: { quest: Quest }) => void;
  setupLoadQuestFailure: (params: { questId: QuestId; error: Error }) => void;
  // Stages what TWO overlapping onQuestChanged firings for the SAME questId each resolve with —
  // the shape two outbox lines from two near-simultaneous PATCHes produce. `slowQuest` answers
  // whichever onQuestChanged call fires FIRST but resolves after `slowDelayMs`; `fastQuest`
  // answers the call that fires SECOND but resolves immediately — reproducing a read for an
  // EARLIER event completing AFTER a read for a LATER one.
  setupLoadQuestOutboxRace: (params: {
    questId: QuestId;
    slowQuest: Quest;
    slowDelayMs: number;
    fastQuest: Quest;
  }) => void;
  setupReplaySuccess: () => void;
  setupReplayFailure: (params: { error: Error }) => void;
  enableDevLogs: () => void;
  getDevLogOutput: () => RecordedCalls;
  getCapturedEventHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
  getOutboxWatchCallbacks: () => {
    onQuestChanged: ((args: { questId: QuestId }) => void) | undefined;
    onError: ((args: { error: unknown }) => void) | undefined;
  };
  getReplayChatHistoryCalls: () => unknown[];
  setupFindQuestPathSuccess: (params: {
    questId: QuestId;
    questPath: AbsoluteFilePath;
    guildId: GuildId;
  }) => void;
} => {
  const dateSpy = registerSpyOn({
    object: Date.prototype,
    method: 'toISOString',
    passthrough: true,
  });
  dateSpy.calledWith([]).returns('2024-01-01T00:00:00.000Z');
  const wsProxy = honoCreateNodeWebSocketAdapterProxy();
  const serveProxy = honoServeAdapterProxy();
  const eventsOnProxy = orchestratorEventsOnAdapterProxy();
  const loadQuestProxy = orchestratorLoadQuestAdapterProxy();
  const replayProxy = orchestratorReplayChatHistoryAdapterProxy();
  const outboxWatchProxy = orchestratorOutboxWatchAdapterProxy();
  orchestratorStopAllChatsAdapterProxy();
  const devLogProxy = processDevLogAdapterProxy();
  pathJoinAdapterProxy();
  locationsWardResultsPathFindBrokerProxy();
  fsReadFileAdapterProxy();
  const findQuestPathProxy = orchestratorFindQuestPathAdapterProxy();
  // Instantiated to satisfy enforce-proxy-child-creation; the broadcaster calls
  // orchestratorFindQuestByWorkItemIdAdapter from its chat-output handler, so the proxy
  // must wire up a mock even when individual tests don't exercise the lookup.
  orchestratorFindQuestByWorkItemIdAdapterProxy();
  wsEventRelayBroadcastBrokerProxy();
  questWaitForSessionStampBrokerProxy();
  const webBundleProxy = webBundleResponseBrokerProxy();
  designProcessStateProxy();
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: '3737' });

  return {
    callResponder: ({ serveWebBundle = false }: { serveWebBundle?: boolean } = {}): void => {
      // Clean up leftover signal handlers from previous tests to prevent listener leaks.
      // Each test creates a new ServerInitResponder that registers SIGTERM/SIGINT handlers.
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
      ServerInitResponder({ app: new Hono(), serveWebBundle });
    },
    setupWebBundleFile: ({ contents }: { contents: FileContents }): void => {
      webBundleProxy.setupFileContents({ contents });
    },
    dispatchRequest: async ({
      url,
      method = 'GET',
    }: {
      url: string;
      method?: string;
    }): Promise<Response> => {
      const appFetch = serveProxy.getCapturedFetch();
      return appFetch(new Request(url, { method }));
    },
    setServerPort: ({ value }: { value: string }): void => {
      portProxy.setEnvPort({ value });
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
    // Keyed on the quest's own id: every real caller (subscribe-quest, replay-quest-history,
    // the outbox onQuestChanged handler) resolves `orchestratorLoadQuestAdapter({ questId })`
    // with the quest's own id, so a test only ever needs to hand this proxy the quest.
    setupLoadQuestSuccess: ({ quest }: { quest: Quest }): void => {
      loadQuestProxy.returns({ questId: quest.id, quest });
    },
    setupLoadQuestFailure: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      loadQuestProxy.throws({ questId, error });
    },
    setupLoadQuestOutboxRace: ({
      questId,
      slowQuest,
      slowDelayMs,
      fastQuest,
    }: {
      questId: QuestId;
      slowQuest: Quest;
      slowDelayMs: number;
      fastQuest: Quest;
    }): void => {
      loadQuestProxy.returnsOnceDelayed({ questId, quest: slowQuest, delayMs: slowDelayMs });
      loadQuestProxy.returnsOnce({ questId, quest: fastQuest });
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
    getDevLogOutput: (): RecordedCalls => devLogProxy.getWrittenLines(),
    getReplayChatHistoryCalls: (): unknown[] => replayProxy.getAllCalledArgs(),
    setupFindQuestPathSuccess: ({
      questId,
      questPath,
      guildId,
    }: {
      questId: QuestId;
      questPath: AbsoluteFilePath;
      guildId: GuildId;
    }): void => {
      findQuestPathProxy.returns({ questId, questPath, guildId });
    },
  };
};
