import { stepOutcomeContract } from './step-outcome-contract';
import { StepOutcomeStub } from './step-outcome.stub';

describe('stepOutcomeContract', () => {
  describe('valid words', () => {
    it.each(['wall', 'unmet', 'done', 'empty'] as const)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(StepOutcomeStub({ value })).toBe(value);
      },
    );
  });

  describe('invalid words', () => {
    it("INVALID: {value: 'confirmed'} => throws, naming the replaced word as invalid", () => {
      expect(() => stepOutcomeContract.parse('confirmed')).toThrow(/confirmed/u);
    });

    it("EMPTY: {value: ''} => throws", () => {
      expect(() => stepOutcomeContract.parse('')).toThrow(/Invalid/u);
    });
  });

  describe('precedence order', () => {
    it('VALID: {} => options is exactly [wall, unmet, done, empty], worst first', () => {
      expect(stepOutcomeContract.options).toStrictEqual(['wall', 'unmet', 'done', 'empty']);
    });
  });
});
