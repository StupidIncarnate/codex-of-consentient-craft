import { ClarifyAnswerFlow } from './clarify-answer-flow';

describe('ClarifyAnswerFlow', () => {
  describe('export', () => {
    it('VALID: ClarifyAnswerFlow => exports an async function', () => {
      expect(ClarifyAnswerFlow).toStrictEqual(expect.any(Function));
    });
  });
});
