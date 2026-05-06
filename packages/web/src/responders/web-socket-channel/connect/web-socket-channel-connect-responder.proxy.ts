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

export const WebSocketChannelConnectResponderProxy = (): ReturnType<
  typeof webSocketChannelStateProxy
> => webSocketChannelStateProxy();
