import { Hono } from '#gateway/npm/hono';
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
import {
  StartOrchestrator,
  isoTimestampContract,
  questFindQuestPathBroker,
  questOutboxWatchBroker,
} from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { orchestrationEventsStateProxy } from '@dungeonmaster/orchestrator/state/orchestration-events/orchestration-events-state.proxy';
import { questFindQuestPathBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questOutboxWatchBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
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
// questOutboxWatchBroker is a specific-broker forward with no caller-level "capture what this
// particular call passed" scenario on its own orchestrator proxy (unlike questFindQuestPathBroker's
// setupQuestPath/setupQuestPathError, which run the REAL broker) — the real broker tails a live fs
// watcher, and this responder's tests need to fire onQuestChanged/onError by hand with an arbitrary
// questId, not through a staged JSONL line. Mocking the broker call itself, in THIS caller's own
// proxy, is the same shape quest-driven-watchers-bootstrap-responder.proxy.ts already uses for the
// identical problem (that responder's own colocated PURPOSE header names the reason).
type OutboxWatchParams = Parameters<typeof questOutboxWatchBroker>[0];
type OnQuestChanged = OutboxWatchParams['onQuestChanged'];
type OnError = OutboxWatchParams['onError'];

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
  // isoTimestampContract is a zod schema (a real class instance, unlike StartOrchestrator's plain
  // arrow-function properties), so extracting `.parse` as a bare registerMock({fn: ...}) reference
  // trips @typescript-eslint/unbound-method — and every workaround that avoids the literal member
  // expression (a computed-key read, a `this: void` cast) also breaks registerMock's own AST
  // transform, which matches that literal expression to wire the mock (see
  // playwright-session-adapter.proxy.ts's identical `chromium.launch` case). registerSpyOn takes
  // the object and a string key instead of tearing off the method, so it never trips the rule.
  // StartOrchestratorProxy's property-access registerMock calls force Jest to bare-automock the
  // whole '@dungeonmaster/orchestrator' module (mock-calls-merge-by-module-transformer's own
  // header), and Jest's automock of a zod schema instance breaks `.parse` (confirmed: it stops
  // validating and returns undefined) — this restores an identity parse. No address: every real
  // call here already passes a valid ISO string, so nothing needs the real implementation.
  const isoTimestampParseSpy = registerSpyOn({ object: isoTimestampContract, method: 'parse' });
  isoTimestampParseSpy.calledWith([]).implement((value: unknown) => value);
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
  // questFindQuestPathBroker is a specific-broker forward. Composed via ITS OWN proxy to satisfy
  // enforce-proxy-child-creation, but this responder's own setupFindQuestPathSuccess stages the
  // broker DIRECTLY (below) rather than through findQuestPathProxy's own setupQuestPath — this
  // responder ALSO composes webBundleResponseBrokerProxy, which shares the same queue-addressed
  // path.join/os.homedir mocks setupQuestPath's real-broker-execution path depends on, and the two
  // proxies' calls interleave in an order neither controls, corrupting the FIFO queue (confirmed:
  // questFindQuestPathBroker computed a guildsDir with a stray null segment and threw
  // QuestNotFoundError even though setupQuestPath had staged a real match). A direct, questId-
  // addressed registerMock sidesteps the shared queue entirely — see this item's DECISIONS.
  questFindQuestPathBrokerProxy();
  const findQuestPathHandle = registerMock({ fn: questFindQuestPathBroker });
  // Instantiated to satisfy enforce-proxy-child-creation; questOutboxWatchBroker is mocked
  // directly below instead (see outboxWatchHandle's own comment).
  questOutboxWatchBrokerProxy();
  const devLogProxy = processDevLogAdapterProxy();
  pathJoinAdapterProxy();
  locationsWardResultsPathFindBrokerProxy();
  fsReadFileAdapterProxy();
  wsEventRelayBroadcastBrokerProxy();
  questWaitForSessionStampBrokerProxy();
  const webBundleProxy = webBundleResponseBrokerProxy();
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: '3737' });

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
  };
};
