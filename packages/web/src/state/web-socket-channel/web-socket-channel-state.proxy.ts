/**
 * PURPOSE: Proxy for webSocketChannelState — composes the underlying websocketConnectAdapterProxy and exposes setup hooks tests use to drive the singleton. Bindings' tests use this proxy instead of websocketConnectAdapterProxy so they exercise the same dispatch + reconnect logic that production runs. Tests must call setupEmpty() before connect() to reset the singleton between cases.
 *
 * USAGE:
 * const proxy = webSocketChannelStateProxy();
 * proxy.setupEmpty();          // reset singleton state
 * proxy.connect();             // boot the channel
 * proxy.deliverMessage({ data }); // simulate inbound WS frame
 * proxy.triggerOpen();         // fire onOpen on the underlying socket
 * proxy.triggerClose();        // fire onClose (channel will schedule reconnect)
 * proxy.getSentMessages();     // outbound JSON parsed messages
 */

import { rxjsFilterAdapterProxy } from '../../adapters/rxjs/filter/rxjs-filter-adapter.proxy';
import { rxjsMergeAdapterProxy } from '../../adapters/rxjs/merge/rxjs-merge-adapter.proxy';
import { rxjsOfAdapterProxy } from '../../adapters/rxjs/of/rxjs-of-adapter.proxy';
import { rxjsSubjectAdapterProxy } from '../../adapters/rxjs/subject/rxjs-subject-adapter.proxy';
import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import type { WsUrl } from '../../contracts/ws-url/ws-url-contract';
import { WsUrlStub } from '../../contracts/ws-url/ws-url.stub';
import { webSocketChannelState } from './web-socket-channel-state';

export const webSocketChannelStateProxy = (): {
  setupEmpty: () => void;
  connect: ({ url }?: { url?: WsUrl }) => void;
  deliverMessage: ({ data }: { data: string }) => void;
  triggerOpen: () => void;
  triggerClose: () => void;
  triggerReconnectFlush: () => void;
  triggerReconnect: () => void;
  getSentMessages: () => unknown[];
} => {
  const wsProxy = websocketConnectAdapterProxy();
  rxjsFilterAdapterProxy();
  rxjsMergeAdapterProxy();
  rxjsOfAdapterProxy();
  rxjsSubjectAdapterProxy();

  return {
    setupEmpty: (): void => {
      webSocketChannelState.clear();
    },
    connect: ({ url = WsUrlStub({ value: 'ws://localhost:3001/ws' }) }: { url?: WsUrl } = {}) => {
      webSocketChannelState.connect({ url });
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
    // triggerReconnect simulates a reconnect after triggerClose: directly calls openConnection
    // (bypassing the real 3s timer) and then explicitly fires onopen on the new socket.
    // The two-step approach (openConnection then explicit onopen) is necessary because
    // websocketConnectAdapterProxy uses deferOpen=false, which fires the onopen setter
    // synchronously during socket construction — BEFORE internalState.socket is assigned.
    // Calling onopen explicitly after openConnection() ensures internalState.socket is
    // non-null when sendReplayHistory checks it.
    triggerReconnect: (): void => {
      webSocketChannelState.openConnection();
      const lastSocket = wsProxy.getSocket();
      if (lastSocket.onopen) {
        lastSocket.onopen();
      }
    },
    getSentMessages: () => wsProxy.getSentMessages(),
  };
};
