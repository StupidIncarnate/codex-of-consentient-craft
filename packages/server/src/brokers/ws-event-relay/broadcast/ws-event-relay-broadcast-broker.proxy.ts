import type { WsMessage } from '@dungeonmaster/shared/contracts';

import type { WSContext } from '#gateway/npm/hono__ws';
import { WsContextStub } from '#gateway/npm/hono__ws/ws-context/ws-context.stub';

export const wsEventRelayBroadcastBrokerProxy = (): {
  captureClient: WSContext;
  getCapturedMessages: () => WsMessage[];
} => {
  const messages: WsMessage[] = [];

  const captureClient = WsContextStub({
    send: (data): void => {
      if (typeof data === 'string') {
        messages.push(JSON.parse(data) as WsMessage);
      }
    },
  });

  return {
    captureClient,
    getCapturedMessages: () => messages,
  };
};
