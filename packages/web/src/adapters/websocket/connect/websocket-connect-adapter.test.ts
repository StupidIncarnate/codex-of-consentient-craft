import { websocketConnectAdapter } from './websocket-connect-adapter';
import { websocketConnectAdapterProxy } from './websocket-connect-adapter.proxy';

describe('websocketConnectAdapter', () => {
  describe('message handling', () => {
    it('VALID: {data: valid JSON} => calls onMessage with parsed JSON', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });

      proxy.receiveMessage({ data: '{"type":"phase-change"}' });

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(onMessage).toHaveBeenCalledWith({ type: 'phase-change' });
    });

    it('EDGE: {data: malformed JSON} => does not call onMessage', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });

      proxy.receiveMessage({ data: 'not-valid-json{' });

      expect(onMessage).toHaveBeenCalledTimes(0);
    });
  });

  describe('close handling', () => {
    it('VALID: {close called} => closes socket and prevents reconnect', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      const connection = websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });
      const socket = proxy.getSocket();

      connection.close();

      expect(socket.close).toHaveBeenCalledTimes(1);
    });

    it('VALID: {server closes} => schedules reconnect via setTimeout', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });

      proxy.triggerClose();

      expect(globalThis.setTimeout).toHaveBeenCalledTimes(1);
    });
  });
});
