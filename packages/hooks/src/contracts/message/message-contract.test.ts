import { messageContract } from './message-contract';
import { MessageStub } from './message.stub';

describe('messageContract', () => {
  describe('valid messages', () => {
    it('VALID: {value: simple string} => parses successfully', () => {
      const message = MessageStub({ value: 'Hello world' });

      const result = messageContract.parse(message);

      expect(result).toBe('Hello world');
    });

    it('VALID: {value: empty string} => parses successfully', () => {
      const message = MessageStub({ value: '' });

      const result = messageContract.parse(message);

      expect(result).toBe('');
    });

    it('VALID: {value: multi-line string} => parses successfully', () => {
      const message = MessageStub({
        value: 'Line 1\nLine 2\nLine 3',
      });

      const result = messageContract.parse(message);

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('invalid messages', () => {
    it('INVALID: {value: number} => throws validation error', () => {
      expect(() => {
        return messageContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {value: null} => throws validation error', () => {
      expect(() => {
        return messageContract.parse(null);
      }).toThrow('Expected string');
    });

    it('INVALID: {value: object} => throws validation error', () => {
      expect(() => {
        return messageContract.parse({ text: 'test' });
      }).toThrow('Expected string');
    });
  });
});
