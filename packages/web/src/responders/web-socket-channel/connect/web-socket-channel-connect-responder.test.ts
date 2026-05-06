import { WebSocketChannelConnectResponder } from './web-socket-channel-connect-responder';
import { WebSocketChannelConnectResponderProxy } from './web-socket-channel-connect-responder.proxy';
import { webSocketChannelState } from '../../../state/web-socket-channel/web-socket-channel-state';

describe('WebSocketChannelConnectResponder', () => {
  describe('connect', () => {
    it('VALID: {http origin} => connects channel via ws:// scheme', () => {
      const proxy = WebSocketChannelConnectResponderProxy();
      proxy.setupEmpty();

      WebSocketChannelConnectResponder();
      proxy.triggerOpen();

      expect(webSocketChannelState.isConnected()).toBe(true);
    });

    it('VALID: {responder return} => returns success AdapterResult', () => {
      const proxy = WebSocketChannelConnectResponderProxy();
      proxy.setupEmpty();

      const result = WebSocketChannelConnectResponder();

      expect(result).toStrictEqual({ success: true });
    });
  });
});
