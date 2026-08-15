import { questStartResponseContract } from './quest-start-response-contract';
import { QuestStartResponseStub } from './quest-start-response.stub';

describe('questStartResponseContract', () => {
  describe('valid bodies', () => {
    it('VALID: {processId only} => parses the 200 success shape', () => {
      const response = QuestStartResponseStub({ processId: 'proc-start-1' });

      const result = questStartResponseContract.parse(response);

      expect(result).toStrictEqual({ processId: 'proc-start-1' });
    });

    it('VALID: {error only} => parses the failure shape', () => {
      const result = questStartResponseContract.parse({
        error: 'quest/add-auth-7bc217a1 already exists — name is in use by other work',
      });

      expect(result).toStrictEqual({
        error: 'quest/add-auth-7bc217a1 already exists — name is in use by other work',
      });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const result = questStartResponseContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {processId: ""} => throws validation error', () => {
      expect(() => questStartResponseContract.parse({ processId: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => questStartResponseContract.parse({ error: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
