/**
 * PURPOSE: Proxy for webSocketChannelState — composes the gateway's WebSocket `connectProxy` and exposes setup hooks tests use to drive the singleton. Bindings' tests use this proxy instead of `connectProxy` so they exercise the same dispatch + reconnect logic that production runs. Tests must call setupEmpty() before connect() to reset the singleton between cases.
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

import { clearTimeoutProxy } from '#gateway/browser/clearTimeout/clear-timeout/clear-timeout.proxy';
import { setTimeoutProxy } from '#gateway/browser/setTimeout/set-timeout/set-timeout.proxy';
import { TimeoutHandleStub } from '#gateway/browser/setTimeout/timeout-handle.stub';
import { connectProxy } from '#gateway/browser/WebSocket/connect/connect.proxy';

import { webSocketChannelState } from './web-socket-channel-state';

const RECONNECT_DELAY_MS = 3000;

export const webSocketChannelStateProxy = ({
  url: defaultUrl = 'ws://localhost:3001/ws',
}: { url?: string } = {}): {
  setupEmpty: () => void;
  connect: ({ url }?: { url?: string }) => void;
  deliverMessage: ({ data }: { data: string }) => void;
  triggerOpen: () => void;
  triggerClose: () => void;
  triggerReconnectFlush: () => void;
  triggerReconnect: () => void;
  getSentMessages: () => unknown[];
} => {
  // The underlying socket mock is staged for whichever URL this proxy was built with — callers
  // that don't pass one get the default test port (3001); WebSocketChannelConnectResponderProxy
  // passes the real jsdom-derived URL because that responder computes its own url and never
  // accepts one from the caller.
  const wsProxy = connectProxy({ url: defaultUrl });
  const timerProxy = setTimeoutProxy();
  clearTimeoutProxy();
  timerProxy.stageHandle({ delay: RECONNECT_DELAY_MS, handle: TimeoutHandleStub() });

  return {
    setupEmpty: (): void => {
      webSocketChannelState.clear();
    },
    connect: ({ url = defaultUrl }: { url?: string } = {}) => {
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
    // The reconnect delay is a private constant inside web-socket-channel-state.ts, so there is no
    // value to key the scheduled setTimeout on. Only one reconnect timer is in flight at a time, so
    // the last recorded call is the one. `.map()` reads the complete call history into callbacks
    // first, so picking the tail is not an unaddressed peek.
    triggerReconnectFlush: () => {
      const callbacks = timerProxy
        .getCallsFor({ delay: RECONNECT_DELAY_MS })
        .map((call) => call[0] as () => void);
      const lastCallback = callbacks.at(-1);
      if (lastCallback) {
        lastCallback();
      }
    },
    // triggerReconnect simulates a reconnect after triggerClose: directly calls openConnection
    // (bypassing the real 3s timer) and then explicitly fires onopen on the new socket.
    // The two-step approach (openConnection then explicit onopen) is necessary because
    // connectProxy uses deferOpen=false, which fires the onopen setter
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
