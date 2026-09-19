import { stepCandidateContract } from './step-candidate-contract';
import { StepCandidateStub } from './step-candidate.stub';

describe('stepCandidateContract', () => {
  describe('valid values', () => {
    it('VALID: {ref and within} => parses a candidate a caller can drive by ref or save by within', () => {
      const candidate = StepCandidateStub({
        index: 0,
        ref: 16,
        within: '[data-testid="GUILD_LIST"]',
        text: '+',
        rect: '(444,348) 27x25',
      });

      const result = stepCandidateContract.parse(candidate);

      expect(result).toStrictEqual({
        index: 0,
        ref: 16,
        within: '[data-testid="GUILD_LIST"]',
        text: '+',
        rect: '(444,348) 27x25',
      });
    });

    it('VALID: {within: null} => parses a candidate sitting at the document root', () => {
      const candidate = StepCandidateStub({
        index: 1,
        ref: 23,
        within: null,
        text: '+',
        rect: '(965,348) 27x25',
      });

      const result = stepCandidateContract.parse(candidate);

      expect(result).toStrictEqual({
        index: 1,
        ref: 23,
        within: null,
        text: '+',
        rect: '(965,348) 27x25',
      });
    });

    it('VALID: {ref: null} => parses a candidate described before any look minted one', () => {
      const candidate = StepCandidateStub({ index: 0, ref: null });

      const result = stepCandidateContract.parse(candidate);

      expect(result.ref).toBe(null);
    });

    it('VALID: {ref omitted} => defaults to null rather than an absent key, because this row is written to disk and read back', () => {
      const result = stepCandidateContract.parse({
        index: 0,
        within: null,
        text: '+',
        rect: '(0,0) 1x1',
      });

      expect(result).toStrictEqual({
        index: 0,
        ref: null,
        within: null,
        text: '+',
        rect: '(0,0) 1x1',
      });
    });

    it('VALID: {two candidates sharing a within} => their refs differ, which is the only thing that separates them', () => {
      const browse = StepCandidateStub({
        index: 0,
        ref: 22,
        within: '[data-testid="MAP_FRAME"]',
        text: 'BROWSE',
        rect: '(742,433) 66x27',
      });
      const create = StepCandidateStub({
        index: 1,
        ref: 26,
        within: '[data-testid="MAP_FRAME"]',
        text: 'CREATE',
        rect: '(607,472) 66x27',
      });

      expect([browse.ref, create.ref]).toStrictEqual([22, 26]);
    });
  });

  describe('invalid values', () => {
    it('INVALID: {index: -1} => throws for a negative index', () => {
      expect(() =>
        stepCandidateContract.parse({
          index: -1,
          ref: null,
          within: null,
          text: '+',
          rect: '(0,0) 1x1',
        }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: {missing text} => throws Required', () => {
      expect(() =>
        stepCandidateContract.parse({ index: 0, ref: null, within: null, rect: '(0,0) 1x1' }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {ref: 0} => throws, because a ref names one element and zero names none', () => {
      expect(() =>
        stepCandidateContract.parse({
          index: 0,
          ref: 0,
          within: null,
          text: '+',
          rect: '(0,0) 1x1',
        }),
      ).toThrow(/Number must be greater than 0/u);
    });
  });
});
