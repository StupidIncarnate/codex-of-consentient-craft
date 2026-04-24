import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { questQueueBrokerProxy } from '../../brokers/quest/queue/quest-queue-broker.proxy';

export const useQuestQueueBindingProxy = (): ReturnType<typeof questQueueBrokerProxy> & {
  websocket: ReturnType<typeof websocketConnectAdapterProxy>;
} => ({
  ...questQueueBrokerProxy(),
  websocket: websocketConnectAdapterProxy(),
});
