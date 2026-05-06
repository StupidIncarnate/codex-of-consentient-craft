/**
 * PURPOSE: Proxy for webSocketChannelMiddleware — composes the underlying websocketConnectAdapterProxy and resets the channel's singleton state on construction. Bindings' tests use this proxy instead of websocketConnectAdapterProxy so they exercise the same dispatch + reconnect logic that production runs.
 *
 * USAGE:
 * const proxy = webSocketChannelMiddlewareProxy();
 * proxy.connect();             // boot the channel
 * proxy.deliverMessage({ data }); // simulate inbound WS frame
 * proxy.triggerOpen();         // fire onOpen on the underlying socket
 * proxy.triggerClose();        // fire onClose (channel will schedule reconnect)
 * proxy.getSentMessages();     // outbound JSON stringified messages
 */

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import type { WsUrl } from '../../contracts/ws-url/ws-url-contract';
import { WsUrlStub } from '../../contracts/ws-url/ws-url.stub';
import { webSocketChannelMiddleware } from './web-socket-channel-middleware';

export const webSocketChannelMiddlewareProxy = (): {
  connect: ({ url }?: { url?: WsUrl }) => void;
  deliverMessage: ({ data }: { data: string }) => void;
  triggerOpen: () => void;
  triggerClose: () => void;
  triggerReconnectFlush: () => void;
  getSentMessages: () => unknown[];
} => {
  webSocketChannelMiddleware.clear();
  const wsProxy = websocketConnectAdapterProxy();

  return {
    connect: ({ url = WsUrlStub({ value: 'ws://localhost:3001/ws' }) }: { url?: WsUrl } = {}) => {
      webSocketChannelMiddleware.connect({ url });
    },
    deliverMessage: ({ data }: { data: string }) => {
      wsProxy.receiveMessage({ data });
    },
    triggerOpen: () => {
      wsProxy.triggerOpen();
    },
    triggerClose: () => {
      wsProxy.triggerClose();
    },
    triggerReconnectFlush: () => {
      wsProxy.triggerReconnect();
    },
    getSentMessages: () => wsProxy.getSentMessages(),
  };
};
