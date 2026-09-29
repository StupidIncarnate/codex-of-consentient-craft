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
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { createNodeWebSocketProxy } from '#gateway/npm/hono__node-ws/node-web-socket/node-web-socket.proxy';
import { serveProxy } from '#gateway/npm/hono__node-server/server/server.proxy';
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
// questOutboxWatchBroker and questFindQuestPathBroker are answered DIRECTLY through their own
// proxies' setupWatchCaptureOnly / setupResolves, not through their real-broker scenarios
// (setupWatchStarted / setupQuestPath). This responder ALSO composes webBundleResponseBrokerProxy,
// and every real execution drives the SAME shared, globally-keyed mocks —
// dungeonmasterHomeFindBrokerProxy's sticky (non-addressed) `os.homedir()` stage and a shared,
// address-keyed `join` mock (`#gateway/node/path`) — with no way to scope a stage to one caller.
// Composing a real execution here corrupts that shared state for whichever OTHER real execution
// runs in the same test: questFindQuestPathBroker computed a guildsDir with a stray segment and
// threw QuestNotFoundError, and questOutboxWatchBroker's own path-join call made
// webBundleResponseBroker's web-bundle-serving tests 500.

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

  // Neither gateway subpath had its own `.proxy.ts` until F49 (confirmed: their wrapper folders
  // held only `.stub.ts`); both now ship one, so this responder's own proxy composes them instead
  // of staging createNodeWebSocket/serve directly on the gateway import.
  const nodeWebSocket = createNodeWebSocketProxy();
  const server = serveProxy();

  const orchestrator = StartOrchestratorProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  // Opt-in: this responder's own test drives every captured handler by hand
  // (getCapturedEventHandler + an arbitrary processId/payload), never through a real `.emit()`, so
  // `.on` is stubbed to record the handler instead of running real.
  eventsProxy.captureHandlers();
  // Both brokers are answered directly (see the shared-mock-state comment above).
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const outboxWatchProxy = questOutboxWatchBrokerProxy();
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
  const listen: { port: Parameters<typeof portProxy.setEnvPort>[0]['value'] } = { port: '3737' };

  return {
    callResponder: ({ serveWebBundle = false }: { serveWebBundle?: boolean } = {}): void => {
      // The responder always starts the outbox watcher; capture its callbacks without running the
      // real broker. Staged here rather than at construction, where a child proxy's semantic method
      // may not be called.
      outboxWatchProxy.setupWatchCaptureOnly();
      // Clean up leftover signal handlers from previous tests to prevent listener leaks.
      // Each test creates a new ServerInitResponder that registers SIGTERM/SIGINT handlers.
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');
      const app = new Hono();
      nodeWebSocket.setupUpgrade({ app });
      server.setupListen({ port: Number(listen.port), hostname: environmentStatics.hostname });
      ServerInitResponder({ app, serveWebBundle });
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
      const capturedOptions = server.getCapturedOptions();
      if (!capturedOptions) {
        throw new Error('fetch not captured. Call callResponder() first.');
      }
      return capturedOptions.fetch(new Request(url, { method }));
    },
    setServerPort: ({ value }: { value: string }): void => {
      listen.port = value;
      portProxy.setEnvPort({ value });
    },
    simulateConnection: ({ client }: { client: WsClient }): void => {
      const handlers = nodeWebSocket.getCapturedUpgradeFactory()?.();
      handlers?.onOpen?.(undefined, client);
    },
    simulateMessage: ({ data, ws }: { data: string; ws: WsClient }): void => {
      const handlers = nodeWebSocket.getCapturedUpgradeFactory()?.();
      handlers?.onMessage?.({ data }, ws);
    },
    simulateDisconnect: ({ ws }: { ws: WsClient }): void => {
      const handlers = nodeWebSocket.getCapturedUpgradeFactory()?.();
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
    } => outboxWatchProxy.getCapturedCallbacks(),
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
      findQuestPathProxy.setupResolves({ questId, questPath, guildId });
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
      findQuestPathProxy.setupResolves({ questId, questPath, guildId });
      wardResultsPathProxy.setupWardResultsPath({ questFolderPath: questPath, wardResultsPath });
      joinHandle.calledWith([wardResultsPath, `${wardResultId}.json`]).returns(detailFilePath);
      readProxy.returns({ path: detailFilePath, contents });
    },
    // Proves a real Hono app reached createNodeWebSocket; the stage is keyed on the exact app
    // callResponder built, and this read-back confirms the responder captured it.
    getCapturedWebSocketAppIsHono: (): boolean => nodeWebSocket.getCapturedApp() instanceof Hono,
  };
};
