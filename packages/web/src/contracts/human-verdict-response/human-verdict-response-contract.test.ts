import { humanVerdictResponseContract } from './human-verdict-response-contract';
import { HumanVerdictResponseStub } from './human-verdict-response.stub';

describe('humanVerdictResponseContract', () => {
  describe('valid bodies', () => {
    it('VALID: {ok: true} => parses the 200 success shape', () => {
      const response = HumanVerdictResponseStub();

      const result = humanVerdictResponseContract.parse(response);

      expect(result).toStrictEqual({ ok: true });
    });

    it('VALID: {error only} => parses the 400 refusal shape', () => {
      const response = humanVerdictResponseContract.parse({
        error: 'Observable "motion-feels-smooth" is not flagged verifyByHuman',
      });

      expect(response).toStrictEqual({
        error: 'Observable "motion-feels-smooth" is not flagged verifyByHuman',
      });
    });

    it('EMPTY: {} => parses with every field absent', () => {
      const response = humanVerdictResponseContract.parse({});

      expect(response).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {ok: false} => throws validation error', () => {
      expect(() => humanVerdictResponseContract.parse({ ok: false })).toThrow(
        /Invalid input: expected/u,
      );
    });

    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => humanVerdictResponseContract.parse({ error: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });
  });
});
