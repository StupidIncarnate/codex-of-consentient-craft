import { questNewResponseContract } from './quest-new-response-contract';
import { QuestNewResponseStub } from './quest-new-response.stub';

describe('questNewResponseContract', () => {
  describe('valid bodies', () => {
    it('VALID: {questId, chatProcessId} => parses the 200 success shape', () => {
      const response = QuestNewResponseStub({
        questId: 'quest-new-1',
        chatProcessId: 'proc-new-1',
      });

      const result = questNewResponseContract.parse(response);

      expect(result).toStrictEqual({ questId: 'quest-new-1', chatProcessId: 'proc-new-1' });
    });

    it('VALID: {error only} => parses the failure shape', () => {
      const result = questNewResponseContract.parse({ error: 'Guild not found' });

      expect(result).toStrictEqual({ error: 'Guild not found' });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const result = questNewResponseContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => questNewResponseContract.parse({ questId: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {chatProcessId: 42} => throws validation error', () => {
      expect(() => questNewResponseContract.parse({ chatProcessId: 42 })).toThrow(
        /Expected string/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => questNewResponseContract.parse({ error: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
