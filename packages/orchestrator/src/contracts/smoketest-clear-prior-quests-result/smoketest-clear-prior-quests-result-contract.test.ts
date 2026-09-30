import { SmoketestClearPriorQuestsResultStub } from './smoketest-clear-prior-quests-result.stub';
import { smoketestClearPriorQuestsResultContract } from './smoketest-clear-prior-quests-result-contract';

describe('smoketestClearPriorQuestsResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SmoketestClearPriorQuestsResultStub();

      expect(smoketestClearPriorQuestsResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {deletedCount: wrong type} => throws', () => {
      expect(() =>
        smoketestClearPriorQuestsResultContract.parse({
          ...SmoketestClearPriorQuestsResultStub(),
          deletedCount: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
