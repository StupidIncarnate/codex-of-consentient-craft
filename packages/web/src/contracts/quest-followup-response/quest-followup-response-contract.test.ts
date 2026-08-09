import { questFollowupResponseContract } from './quest-followup-response-contract';
import { QuestFollowupResponseStub } from './quest-followup-response.stub';

describe('questFollowupResponseContract', () => {
  describe('valid bodies', () => {
    it('VALID: {chatProcessId only} => parses the 200 success shape', () => {
      const response = QuestFollowupResponseStub({ chatProcessId: 'proc-followup-1' });

      const result = questFollowupResponseContract.parse(response);

      expect(result).toStrictEqual({ chatProcessId: 'proc-followup-1' });
    });

    it('VALID: {error only} => parses the failure shape', () => {
      const result = questFollowupResponseContract.parse({
        error: 'Quest must be blocked, complete or merged for follow-up',
      });

      expect(result).toStrictEqual({
        error: 'Quest must be blocked, complete or merged for follow-up',
      });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const result = questFollowupResponseContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {chatProcessId: ""} => throws validation error', () => {
      expect(() => questFollowupResponseContract.parse({ chatProcessId: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => questFollowupResponseContract.parse({ error: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
