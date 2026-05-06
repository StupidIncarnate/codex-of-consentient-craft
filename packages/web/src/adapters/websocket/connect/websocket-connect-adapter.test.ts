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
    it('VALID: {close called} => closes socket', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      const connection = websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });
      const socket = proxy.getSocket();

      connection.close();

      expect(socket.close).toHaveBeenCalledTimes(1);
    });

    it('VALID: {server closes with onClose provided} => calls onClose', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();
      const onClose = jest.fn();

      websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage, onClose });

      proxy.triggerClose();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('send', () => {
    it('VALID: {socket open} => sends JSON-stringified data', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      const connection = websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });

      connection.send({ type: 'test', value: 'hello' });

      const socket = proxy.getSocket();

      expect(socket.send.mock.calls).toStrictEqual([['{"type":"test","value":"hello"}']]);
    });

    it('EDGE: {socket not open} => does not send', () => {
      const proxy = websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      const connection = websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });

      const socket = proxy.getSocket();
      (socket as never as { readyState: typeof WebSocket.CLOSED }).readyState = WebSocket.CLOSED;

      connection.send({ type: 'test' });

      expect(socket.send).toHaveBeenCalledTimes(0);
    });
  });

  describe('onOpen callback', () => {
    it('VALID: {onOpen provided} => calls onOpen when socket opens', () => {
      websocketConnectAdapterProxy();
      const onMessage = jest.fn();
      const onOpen = jest.fn();

      websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage, onOpen });

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('EDGE: {onOpen not provided} => returns connection object when socket opens', () => {
      websocketConnectAdapterProxy();
      const onMessage = jest.fn();

      const result = websocketConnectAdapter({ url: 'ws://localhost:3001/ws', onMessage });

      expect(result).toStrictEqual({
        close: expect.any(Function),
        send: expect.any(Function),
      });
    });
  });
});
