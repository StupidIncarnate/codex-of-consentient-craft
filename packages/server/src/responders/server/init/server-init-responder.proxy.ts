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
import { createNodeWebSocket } from '#gateway/npm/hono__node-ws';
import { serve } from '#gateway/npm/hono__node-server';
import {
  StartOrchestrator,
  questFindQuestPathBroker,
  questOutboxWatchBroker,
} from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { orchestrationEventsStateProxy } from '@dungeonmaster/orchestrator/state/orchestration-events/orchestration-events-state.proxy';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questOutboxWatchBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { questWaitForSessionStampBrokerProxy } from '../../../brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.proxy';
import { webBundleResponseBrokerProxy } from '../../../brokers/web-bundle/response/web-bundle-response-broker.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { processDevLogBrokerProxy } from '../../../brokers/process/dev-log/process-dev-log-broker.proxy';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { ServerInitResponder } from './server-init-responder';

// Module-level mock prevents @hono/node-server from loading and registering SIGTERM listeners.
// Targets the RAW npm specifier, not the gateway barrel — this suppresses the real package's own
// module-load side effect, which happens the moment anything (the gateway's pass-through barrel
// included) resolves it.
registerModuleMock({ module: '@hono/node-server' });

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
  getCapturedWebSocketAppIsHono: () => boolean;
} => {
  const dateSpy = registerSpyOn({
    object: Date.prototype,
    method: 'toISOString',
    passthrough: true,
  });
  dateSpy.calledWith([]).returns('2024-01-01T00:00:00.000Z');

  // Neither `#gateway/npm/hono__node-ws` nor `#gateway/npm/hono__node-server` ships a `.proxy.ts`
  // for createNodeWebSocket/serve (confirmed: their wrapper folders hold only `.stub.ts`), so this
  // responder's own proxy stages both directly on the gateway import, inlining what the deleted
  // adapters' own proxies did.
  const wsHandle = registerMock({ fn: createNodeWebSocket });
  const wsCaptured: {
    factory?: () => {
      onOpen?: (evt: unknown, ws: unknown) => void;
      onMessage?: (evt: unknown, ws: unknown) => void;
      onClose?: (evt: unknown, ws: unknown) => void;
    };
  } = {};
  // createNodeWebSocket is called once per test with a fresh `new Hono()` instance this proxy never
  // sees ahead of time — nothing to key on beyond "the one call this test made".
  wsHandle.calledWith([]).returns({
    injectWebSocket: jest.fn(),
    upgradeWebSocket: (
      factory: () => {
        onOpen?: (evt: unknown, ws: unknown) => void;
        onMessage?: (evt: unknown, ws: unknown) => void;
        onClose?: (evt: unknown, ws: unknown) => void;
      },
    ) => {
      wsCaptured.factory = factory;
      return jest.fn() as never;
    },
  } as never);

  const serveHandle = registerMock({ fn: serve });
  const serveCaptured: { fetch?: (request: Request) => Response | Promise<Response> } = {};
  // ServerInitResponder is called exactly once per test (one server instance); the port/hostname
  // it's called with varies across tests (default 3737, overridden via setServerPort) but does not
  // change what's under test here — capturing the fetch handler regardless of port.
  serveHandle.calledWith([]).implement(((options: {
    fetch: (request: Request) => Response | Promise<Response>;
  }) => {
    serveCaptured.fetch = options.fetch;
    return {} as never;
  }) as unknown as typeof serve);

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
  const devLogProxy = processDevLogBrokerProxy();
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
      if (!serveCaptured.fetch) {
        throw new Error('fetch not captured. Call callResponder() first.');
      }
      const appFetch = serveCaptured.fetch;
      return appFetch(new Request(url, { method }));
    },
    setServerPort: ({ value }: { value: string }): void => {
      portProxy.setEnvPort({ value });
    },
    simulateConnection: ({ client }: { client: WsClient }): void => {
      const handlers = wsCaptured.factory?.();
      handlers?.onOpen?.(undefined, client);
    },
    simulateMessage: ({ data, ws }: { data: string; ws: WsClient }): void => {
      const handlers = wsCaptured.factory?.();
      handlers?.onMessage?.({ data }, ws);
    },
    simulateDisconnect: ({ ws }: { ws: WsClient }): void => {
      const handlers = wsCaptured.factory?.();
      handlers?.onClose?.(undefined, ws);
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
    // Proves a real Hono app reached createNodeWebSocket — wsHandle's own stage is address-less
    // (a fresh `new Hono()` per test, nothing to key on in advance), so this call-readback is the
    // only way to catch a call that passed the wrong (or no) app through.
    getCapturedWebSocketAppIsHono: (): boolean => {
      const call = [...wsHandle.callsMatching([])].at(-1);
      const options = call?.[0] as Parameters<typeof createNodeWebSocket>[0] | undefined;
      return options?.app instanceof Hono;
    },
  };
};
