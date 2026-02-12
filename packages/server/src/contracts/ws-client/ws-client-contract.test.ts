import { wsClientContract } from './ws-client-contract';
import { WsClientStub } from './ws-client.stub';

describe('wsClientContract', () => {
  describe('valid inputs', () => {
    it('VALID: {send: function} => parses successfully', () => {
      const client = WsClientStub();

      const result = wsClientContract.parse(client);

      expect(typeof result.send).toBe('function');
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates ws client with jest.fn send', () => {
      const result = WsClientStub();

      expect(typeof result.send).toBe('function');
    });

    it('VALID: {custom send} => creates ws client with provided send', () => {
      const customSend = jest.fn();
      const result = WsClientStub({ send: customSend });

      expect(result.send).toBe(customSend);
    });
  });
});
