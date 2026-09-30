import { ClarifyAnswerResultStub } from './clarify-answer-result.stub';
import { clarifyAnswerResultContract } from './clarify-answer-result-contract';

describe('clarifyAnswerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ClarifyAnswerResultStub();

      expect(clarifyAnswerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chatProcessId: wrong type} => throws', () => {
      expect(() =>
        clarifyAnswerResultContract.parse({ ...ClarifyAnswerResultStub(), chatProcessId: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
