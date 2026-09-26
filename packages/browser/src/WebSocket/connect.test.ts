import { connect } from './connect';
import { connectProxy } from './connect.proxy';

describe('connect', () => {
  describe('message handling', () => {
    it('VALID: {data: valid JSON} => calls onMessage with parsed JSON', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();

      connect({ url: 'ws://localhost:3001/ws', onMessage });
      proxy.receiveMessage({ data: '{"type":"phase-change"}' });

      expect(onMessage).toHaveBeenCalledTimes(1);
      expect(onMessage).toHaveBeenCalledWith({ type: 'phase-change' });
    });

    it('EDGE: {data: malformed JSON} => does not call onMessage', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();

      connect({ url: 'ws://localhost:3001/ws', onMessage });
      proxy.receiveMessage({ data: 'not-valid-json{' });

      expect(onMessage).toHaveBeenCalledTimes(0);
    });
  });

  describe('close handling', () => {
    it('VALID: {close called} => closes socket', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();

      const connection = connect({ url: 'ws://localhost:3001/ws', onMessage });
      const socket = proxy.getSocket();
      connection.close();

      expect(socket.close).toHaveBeenCalledTimes(1);
    });

    it('VALID: {server closes with onClose provided} => calls onClose', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();
      const onClose = jest.fn();

      connect({ url: 'ws://localhost:3001/ws', onMessage, onClose });
      proxy.triggerClose();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('VALID: {socket errors with onError provided} => calls onError', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();
      const onError = jest.fn();

      connect({ url: 'ws://localhost:3001/ws', onMessage, onError });
      proxy.triggerError();

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('EDGE: {socket errors then closes, onError not provided} => does not throw', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();
      const onClose = jest.fn();

      connect({ url: 'ws://localhost:3001/ws', onMessage, onClose });
      proxy.triggerError();
      proxy.triggerClose();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('send', () => {
    it('VALID: {socket open} => sends JSON-stringified data', () => {
      const proxy = connectProxy();
      const onMessage = jest.fn();

      const connection = connect({ url: 'ws://localhost:3001/ws', onMessage });
      connection.send({ type: 'test', value: 'hello' });

      expect(proxy.getSentMessages()).toStrictEqual([{ type: 'test', value: 'hello' }]);
    });

    it('EDGE: {socket not open} => does not send, returns false', () => {
      const proxy = connectProxy({ deferOpen: true });
      const onMessage = jest.fn();

      const connection = connect({ url: 'ws://localhost:3001/ws', onMessage });
      const result = connection.send({ type: 'test' });

      expect(result).toBe(false);
      expect(proxy.getSentMessages()).toStrictEqual([]);
    });
  });

  describe('onOpen callback', () => {
    it('VALID: {onOpen provided} => calls onOpen when socket opens', () => {
      connectProxy();
      const onMessage = jest.fn();
      const onOpen = jest.fn();

      connect({ url: 'ws://localhost:3001/ws', onMessage, onOpen });

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('EDGE: {onOpen not provided} => returns a connection object without throwing', () => {
      connectProxy();
      const onMessage = jest.fn();

      const result = connect({ url: 'ws://localhost:3001/ws', onMessage });

      expect(result).toStrictEqual({
        close: expect.any(Function),
        send: expect.any(Function),
      });
    });
  });
});
