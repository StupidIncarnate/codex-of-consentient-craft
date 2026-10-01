import { questClarifyErrorContract } from './quest-clarify-error-contract';
import { QuestClarifyErrorStub } from './quest-clarify-error.stub';

describe('questClarifyErrorContract', () => {
  describe('valid bodies', () => {
    it('VALID: {error} => parses the refusal text', () => {
      const result = questClarifyErrorContract.parse(
        QuestClarifyErrorStub({ error: 'An answer carries more than 5 images' }),
      );

      expect(result).toStrictEqual({ error: 'An answer carries more than 5 images' });
    });

    it('EMPTY: {} => parses with the error absent', () => {
      const result = questClarifyErrorContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {error: ""} => throws validation error', () => {
      expect(() => questClarifyErrorContract.parse({ error: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });
  });
});
