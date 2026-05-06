import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { rateLimitsGetBrokerProxy } from '../../brokers/rate-limits/get/rate-limits-get-broker.proxy';

export const useRateLimitsBindingProxy = (): ReturnType<typeof rateLimitsGetBrokerProxy> & {
  websocket: ReturnType<typeof websocketConnectAdapterProxy>;
} => ({
  ...rateLimitsGetBrokerProxy(),
  websocket: websocketConnectAdapterProxy(),
});
