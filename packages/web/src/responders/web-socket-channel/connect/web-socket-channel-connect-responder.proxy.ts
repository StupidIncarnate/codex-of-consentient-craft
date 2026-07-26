/**
 * PURPOSE: Proxy for WebSocketChannelConnectResponder — composes webSocketChannelStateProxy so tests can drive the channel after the responder runs.
 *
 * USAGE:
 * const proxy = WebSocketChannelConnectResponderProxy();
 * proxy.setupEmpty();
 * WebSocketChannelConnectResponder();
 * proxy.triggerOpen();
 */

import { webSocketChannelStateProxy } from '../../../state/web-socket-channel/web-socket-channel-state.proxy';
import { WsUrlStub } from '../../../contracts/ws-url/ws-url.stub';

// WebSocketChannelConnectResponder computes its own URL from globalThis.location (protocol +
// host) instead of accepting one — jest.config.cjs pins testEnvironmentOptions.url to
// 'http://localhost' (no port), so the responder always calls WebSocket("ws://localhost/ws")
// under test. Stage the underlying socket mock for that exact URL, not
// webSocketChannelStateProxy's default test port.
export const WebSocketChannelConnectResponderProxy = (): ReturnType<
  typeof webSocketChannelStateProxy
> => webSocketChannelStateProxy({ url: WsUrlStub({ value: 'ws://localhost/ws' }) });
