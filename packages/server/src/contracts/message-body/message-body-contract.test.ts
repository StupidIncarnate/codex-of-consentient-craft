import { messageBodyContract } from './message-body-contract';
import { MessageBodyStub } from './message-body.stub';

describe('messageBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {message: "hello"} => parses successfully', () => {
      const result = messageBodyContract.parse({ message: 'hello' });

      expect(result).toStrictEqual({ message: 'hello' });
    });

    it('VALID: stub default => returns default message', () => {
      const result = MessageBodyStub();

      expect(result).toStrictEqual({ message: 'hello world' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {message: ""} => throws validation error', () => {
      expect(() => {
        messageBodyContract.parse({ message: '' });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {} => throws validation error', () => {
      expect(() => {
        messageBodyContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
