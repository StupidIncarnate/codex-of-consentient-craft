import { questChatResponseContract } from './quest-chat-response-contract';
import { QuestChatResponseStub } from './quest-chat-response.stub';

describe('questChatResponseContract', () => {
  describe('valid bodies', () => {
    it('VALID: {chatProcessId only} => parses the 200 success shape', () => {
      const response = QuestChatResponseStub({ chatProcessId: 'proc-chat-1' });

      const result = questChatResponseContract.parse(response);

      expect(result).toStrictEqual({ chatProcessId: 'proc-chat-1' });
    });

    it('VALID: {error only} => parses the failure shape', () => {
      const result = questChatResponseContract.parse({ error: 'Quest is not accepting messages' });

      expect(result).toStrictEqual({ error: 'Quest is not accepting messages' });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const result = questChatResponseContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {chatProcessId: ""} => throws validation error', () => {
      expect(() => questChatResponseContract.parse({ chatProcessId: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => questChatResponseContract.parse({ error: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });
  });
});
