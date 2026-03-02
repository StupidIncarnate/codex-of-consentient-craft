import { Hono } from 'hono';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type { OrchestrationEventType, ProcessId } from '@dungeonmaster/shared/contracts';

import { honoCreateNodeWebSocketAdapterProxy } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { honoServeAdapterProxy } from '../../../adapters/hono/serve/hono-serve-adapter.proxy';
import { orchestratorEventsOnAdapterProxy } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter.proxy';
import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';
import { orchestratorReplayChatHistoryAdapterProxy } from '../../../adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter.proxy';
import { orchestratorStopAllChatsAdapterProxy } from '../../../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { agentOutputBufferStateProxy } from '../../../state/agent-output-buffer/agent-output-buffer-state.proxy';
import { ServerInitResponder } from './server-init-responder';

type Quest = ReturnType<typeof QuestStub>;
type EventHandler = (args: { processId: ProcessId; payload: Record<string, unknown> }) => void;

export const ServerInitResponderProxy = (): {
  callResponder: () => void;
  simulateConnection: (params: { client: WsClient }) => void;
  simulateMessage: (params: { data: string; ws: WsClient }) => void;
  simulateDisconnect: (params: { ws: WsClient }) => void;
  setupLoadQuestSuccess: (params: { quest: Quest }) => void;
  setupLoadQuestFailure: (params: { error: Error }) => void;
  setupReplaySuccess: () => void;
  setupReplayFailure: (params: { error: Error }) => void;
  getCapturedEventHandler: (params: { type: OrchestrationEventType }) => EventHandler | undefined;
} => {
  const wsProxy = honoCreateNodeWebSocketAdapterProxy();
  honoServeAdapterProxy();
  const eventsOnProxy = orchestratorEventsOnAdapterProxy();
  const loadQuestProxy = orchestratorLoadQuestAdapterProxy();
  const replayProxy = orchestratorReplayChatHistoryAdapterProxy();
  orchestratorStopAllChatsAdapterProxy();
  processDevLogAdapterProxy();
  wsEventRelayBroadcastBrokerProxy();
  agentOutputBufferStateProxy();

  return {
    callResponder: (): void => {
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
  };
};
