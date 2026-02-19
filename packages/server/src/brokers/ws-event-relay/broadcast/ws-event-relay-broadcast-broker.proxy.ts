import type { WsMessage } from '@dungeonmaster/shared/contracts';

import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

export const wsEventRelayBroadcastBrokerProxy = (): {
  captureClient: WsClient;
  getCapturedMessages: () => WsMessage[];
} => {
  const messages: WsMessage[] = [];

  const captureClient = WsClientStub({
    send: jest.fn((data: string) => {
      messages.push(JSON.parse(data) as WsMessage);
    }),
  });

  return {
    captureClient,
    getCapturedMessages: () => messages,
  };
};
