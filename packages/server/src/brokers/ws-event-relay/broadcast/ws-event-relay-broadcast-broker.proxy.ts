import * as broadcastModule from './ws-event-relay-broadcast-broker';
import type { WsMessage } from '@dungeonmaster/shared/contracts';

export const wsEventRelayBroadcastBrokerProxy = (): {
  getCapturedMessages: () => WsMessage[];
} => {
  const messages: WsMessage[] = [];

  jest.spyOn(broadcastModule, 'wsEventRelayBroadcastBroker').mockImplementation((params) => {
    messages.push(params.message);
    return new Set();
  });

  return {
    getCapturedMessages: () => messages,
  };
};
