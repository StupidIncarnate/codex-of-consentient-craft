import { questStartBodyContract } from './quest-start-body-contract';
import { QuestStartBodyStub } from './quest-start-body.stub';

describe('questStartBodyContract', () => {
  describe('valid inputs', () => {
    it('EMPTY: {} => parses to an empty body', () => {
      const result = QuestStartBodyStub();

      expect(result).toStrictEqual({});
    });

    it('VALID: {play: false} => parses with play false', () => {
      const result = QuestStartBodyStub({ play: false });

      expect(result).toStrictEqual({ play: false });
    });

    it('VALID: {play: true} => parses with play true', () => {
      const result = questStartBodyContract.parse({ play: true });

      expect(result).toStrictEqual({ play: true });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {play: "no"} => throws validation error', () => {
      expect(() => {
        questStartBodyContract.parse({ play: 'no' });
      }).toThrow(/Expected boolean, received string/u);
    });
  });
});
