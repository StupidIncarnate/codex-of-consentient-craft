import { chatLineSourceContract } from './chat-line-source-contract';
import { ChatLineSourceStub } from './chat-line-source.stub';

describe('chatLineSourceContract', () => {
  describe('valid sources', () => {
    it('VALID: {value: "session"} => parses successfully', () => {
      const result = ChatLineSourceStub({ value: 'session' });

      expect(chatLineSourceContract.parse(result)).toBe('session');
    });

    it('VALID: {value: "subagent"} => parses successfully', () => {
      const result = ChatLineSourceStub({ value: 'subagent' });

      expect(chatLineSourceContract.parse(result)).toBe('subagent');
    });
  });

  describe('invalid sources', () => {
    it('INVALID_VALUE: {value: "unknown"} => throws validation error', () => {
      expect(() => chatLineSourceContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });
  });
});
