import { stepCandidateContract } from './step-candidate-contract';
import { StepCandidateStub } from './step-candidate.stub';

describe('stepCandidateContract', () => {
  describe('valid values', () => {
    it('VALID: {within: a selector} => parses a candidate scoped under a testId ancestor', () => {
      const candidate = StepCandidateStub({
        index: 0,
        within: '[data-testid="GUILD_LIST"]',
        text: '+',
        rect: '(444,348) 27x25',
      });

      const result = stepCandidateContract.parse(candidate);

      expect(result).toStrictEqual({
        index: 0,
        within: '[data-testid="GUILD_LIST"]',
        text: '+',
        rect: '(444,348) 27x25',
      });
    });

    it('VALID: {within: null} => parses a candidate sitting at the document root', () => {
      const candidate = StepCandidateStub({
        index: 1,
        within: null,
        text: '+',
        rect: '(965,348) 27x25',
      });

      const result = stepCandidateContract.parse(candidate);

      expect(result).toStrictEqual({
        index: 1,
        within: null,
        text: '+',
        rect: '(965,348) 27x25',
      });
    });
  });

  describe('invalid values', () => {
    it('INVALID: {index: -1} => throws for a negative index', () => {
      expect(() =>
        stepCandidateContract.parse({ index: -1, within: null, text: '+', rect: '(0,0) 1x1' }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: {missing text} => throws Required', () => {
      expect(() =>
        stepCandidateContract.parse({ index: 0, within: null, rect: '(0,0) 1x1' }),
      ).toThrow(/Required/u);
    });
  });
});
