import { unhandledRequestMessageContract } from './unhandled-request-message-contract';
import { UnhandledRequestMessageStub } from './unhandled-request-message.stub';

describe('unhandledRequestMessageContract', () => {
  describe('valid messages', () => {
    it('VALID: {value: "GET http://localhost/api/missing"} => parses successfully', () => {
      const message = UnhandledRequestMessageStub({ value: 'GET http://localhost/api/missing' });

      const result = unhandledRequestMessageContract.parse(message);

      expect(result).toBe('GET http://localhost/api/missing');
    });

    it('VALID: {value: "WS wss://example.com/socket"} => parses successfully', () => {
      const message = UnhandledRequestMessageStub({ value: 'WS wss://example.com/socket' });

      const result = unhandledRequestMessageContract.parse(message);

      expect(result).toBe('WS wss://example.com/socket');
    });
  });

  describe('invalid messages', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => unhandledRequestMessageContract.parse(123 as never)).toThrow(/expected string/u);
    });
  });
});
