import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { toolingRunSmoketestBrokerProxy } from '../../brokers/tooling/run-smoketest/tooling-run-smoketest-broker.proxy';

export const useSmoketestRunBindingProxy = (): ReturnType<typeof toolingRunSmoketestBrokerProxy> & {
  websocket: ReturnType<typeof websocketConnectAdapterProxy>;
} => ({
  ...toolingRunSmoketestBrokerProxy(),
  websocket: websocketConnectAdapterProxy(),
});
