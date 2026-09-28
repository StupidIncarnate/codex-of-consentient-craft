import { Hono } from '#gateway/npm/hono';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileContents,
  FilePath,
  GuildId,
  OrchestrationEventType,
  ProcessId,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import {
  portResolveBrokerProxy,
  locationsWardResultsPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { join } from '#gateway/node/path';
import {
  StartOrchestrator,
  questFindQuestPathBroker,
  questOutboxWatchBroker,
} from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { orchestrationEventsStateProxy } from '@dungeonmaster/orchestrator/state/orchestration-events/orchestration-events-state.proxy';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questOutboxWatchBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { honoCreateNodeWebSocketAdapterProxy } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { honoServeAdapterProxy } from '../../../adapters/hono/serve/hono-serve-adapter.proxy';
import { questWaitForSessionStampBrokerProxy } from '../../../brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.proxy';
import { webBundleResponseBrokerProxy } from '../../../brokers/web-bundle/response/web-bundle-response-broker.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { ServerInitResponder } from './server-init-responder';

type Quest = ReturnType<typeof QuestStub>;
type EventHandler = (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;
// questOutboxWatchBroker and questFindQuestPathBroker are specific-broker forwards mocked
// DIRECTLY here rather than through their own proxy's real-broker-execution scenarios
// (setupWatchStarted / setupQuestPath). This responder ALSO composes webBundleResponseBrokerProxy,
// and every one of these real executions drives the SAME shared, globally-keyed mocks —
// dungeonmasterHomeFindBrokerProxy's sticky (non-addressed) `os.homedir()` stage and a shared,
// address-keyed `join` mock (`#gateway/node/path`) — with no way to scope a stage to one caller.
// Composing any of the real executions here (confirmed for both) corrupts that shared state for
// whichever OTHER real execution runs in the same test: questFindQuestPathBroker computed a
// guildsDir with a stray segment and threw QuestNotFoundError even though setupQuestPath had
// staged a real match, and questOutboxWatchBroker's own path-join call made
// webBundleResponseBroker's web-bundle-serving tests 500. A direct, argument-addressed
// registerMock for each sidesteps the shared queue entirely.
type OutboxWatchParams = Parameters<typeof questOutboxWatchBroker>[0];
type OnQuestChanged = OutboxWatchParams['onQuestChanged'];
type OnError = OutboxWatchParams['onError'];

export const ServerInitResponderProxy = (): {
  callResponder: (params?: { serveWebBundle?: boolean }) => void;
  dispatchRequest: (params: { url: string; method?: string }) => Promise<Response>;
  setServerPort: (params: { value: string }) => void;
  setupWebBundleFile: (params: { contents: FileContents; expectedRelativePath: string }) => void;
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
  setupWardDetailSuccess: (params: {
    questId: QuestId;
    questPath: AbsoluteFilePath;
    guildId: GuildId;
    wardResultId: string;
    wardResultsPath: FilePath;
    detailFilePath: FilePath;
    contents: FileContents;
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
  const orchestrator = StartOrchestratorProxy();
  // Second handle on the SAME mocked StartOrchestrator.replayChatHistory function — shares staged
  // calls with the handle StartOrchestratorProxy already registered (jestRegisterMockAdapter keys
  // its state by the mock function itself, the same pattern quest-chat-responder.proxy.ts uses for
  // startChatHandle). A default success here is what the caller's own async wrapping used to give
  // an unstaged call for free before A02 deleted the adapter layer: replayChatHistory is called
  // directly now, so an unstaged call throws SYNCHRONOUSLY (registerMock has no passthrough),
  // which lands before a `.catch()` chained on that same expression can attach — the throw is only
  // safely turned into a promise rejection one function boundary up, where none of this responder's
  // OWN call sites intend it to surface. Every real caller discards the resolved value.
  const replayChatHistoryHandle = registerMock({ fn: StartOrchestrator.replayChatHistory });
  replayChatHistoryHandle.calledWith([]).resolves(undefined);
  const eventsProxy = orchestrationEventsStateProxy();
  // Opt-in: this responder's own test drives every captured handler by hand
  // (getCapturedEventHandler + an arbitrary processId/payload), never through a real `.emit()`, so
  // `.on` is stubbed to record the handler instead of running real.
  eventsProxy.captureHandlers();
  // Instantiated to satisfy enforce-proxy-child-creation; both brokers are mocked directly below
  // instead (see the shared-mock-state comment above).
  questFindQuestPathBrokerProxy();
  questOutboxWatchBrokerProxy();
  const devLogProxy = processDevLogAdapterProxy();
  const wardResultsPathProxy = locationsWardResultsPathFindBrokerProxy();
  const readProxy = readFileProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier server-init-responder.ts imports. Addressed by the exact tuple the ward-detail-request
  // handler joins: the ward-results directory (staged separately via wardResultsPathProxy, on this
  // SAME shared join handle) plus `${wardResultId}.json`.
  const joinHandle = registerMock({ fn: join });
  wsEventRelayBroadcastBrokerProxy();
  questWaitForSessionStampBrokerProxy();
  const webBundleProxy = webBundleResponseBrokerProxy();
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: '3737' });

  const findQuestPathHandle = registerMock({ fn: questFindQuestPathBroker });

  const outboxWatchHandle = registerMock({ fn: questOutboxWatchBroker });
  const outboxCaptured: {
    onQuestChanged: OnQuestChanged | undefined;
    onError: OnError | undefined;
  } = { onQuestChanged: undefined, onError: undefined };
  // The only call this broker ever receives from this responder is `{ onQuestChanged, onError }`,
  // a pair of fresh closures built inline on every call — closures never compare equal, so `[]` is
  // the honest address. This captures whatever callbacks the call received so
  // getOutboxWatchCallbacks() can hand them back to the test.
  outboxWatchHandle
    .calledWith([])
    .implement(
      async ({ onQuestChanged, onError }: OutboxWatchParams): Promise<{ stop: () => void }> => {
        outboxCaptured.onQuestChanged = onQuestChanged;
        outboxCaptured.onError = onError;
        return Promise.resolve({ stop: (): void => undefined });
      },
    );

  return {
    callResponder: ({ serveWebBundle = false }: { serveWebBundle?: boolean } = {}): void => {
      // Clean up leftover signal handlers from previous tests to prevent listener leaks.
      // Each test creates a new ServerInitResponder that registers SIGTERM/SIGINT handlers.
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
      ServerInitResponder({ app: new Hono(), serveWebBundle });
    },
    setupWebBundleFile: ({
      contents,
      expectedRelativePath,
    }: {
      contents: FileContents;
      expectedRelativePath: string;
    }): void => {
      webBundleProxy.setupFileContents({ contents, expectedRelativePath });
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
    // the outbox onQuestChanged handler) resolves `StartOrchestrator.loadQuest({ questId })`
    // with the quest's own id, so a test only ever needs to hand this proxy the quest.
    setupLoadQuestSuccess: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupLoadQuestFailure: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
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
      orchestrator.loadQuestReturnsOnceDelayed({ questId, quest: slowQuest, delayMs: slowDelayMs });
      orchestrator.loadQuestReturnsOnce({ questId, quest: fastQuest });
    },
    setupReplaySuccess: (): void => {
      orchestrator.replayChatHistorySetupSuccess();
    },
    setupReplayFailure: ({ error }: { error: Error }): void => {
      orchestrator.replayChatHistorySetupFailure({ error });
    },
    getCapturedEventHandler: ({
      type,
    }: {
      type: OrchestrationEventType;
    }): EventHandler | undefined => eventsProxy.getCapturedHandler({ type }),
    getOutboxWatchCallbacks: (): {
      onQuestChanged: ((args: { questId: QuestId }) => void) | undefined;
      onError: ((args: { error: unknown }) => void) | undefined;
    } => outboxCaptured,
    enableDevLogs: (): void => {
      devLogProxy.enableVerbose();
    },
    getDevLogOutput: (): RecordedCalls => devLogProxy.getWrittenLines(),
    getReplayChatHistoryCalls: (): unknown[] => [...orchestrator.replayChatHistoryGetCalls()],
    setupFindQuestPathSuccess: ({
      questId,
      questPath,
      guildId,
    }: {
      questId: QuestId;
      questPath: AbsoluteFilePath;
      guildId: GuildId;
    }): void => {
      findQuestPathHandle.calledWith([{ questId }]).resolves({ questPath, guildId });
    },
    setupWardDetailSuccess: ({
      questId,
      questPath,
      guildId,
      wardResultId,
      wardResultsPath,
      detailFilePath,
      contents,
    }: {
      questId: QuestId;
      questPath: AbsoluteFilePath;
      guildId: GuildId;
      wardResultId: string;
      wardResultsPath: FilePath;
      detailFilePath: FilePath;
      contents: FileContents;
    }): void => {
      findQuestPathHandle.calledWith([{ questId }]).resolves({ questPath, guildId });
      wardResultsPathProxy.setupWardResultsPath({ questFolderPath: questPath, wardResultsPath });
      joinHandle.calledWith([wardResultsPath, `${wardResultId}.json`]).returns(detailFilePath);
      readProxy.returns({ path: detailFilePath, contents });
    },
  };
};
