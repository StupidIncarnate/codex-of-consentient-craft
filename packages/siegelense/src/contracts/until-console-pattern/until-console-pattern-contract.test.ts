import { untilConsolePatternContract } from './until-console-pattern-contract';
import { UntilConsolePatternStub } from './until-console-pattern.stub';

describe('untilConsolePatternContract', () => {
  describe('an unwrapped pattern', () => {
    it.each(['hydrated', 'app (hydrated|ready)', 'a/b'])(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(UntilConsolePatternStub({ value })).toBe(value);
      },
    );
  });

  describe('a slash-wrapped regex literal', () => {
    it('INVALID: {value: "/hydrated/"} => throws naming the unwrapped form', () => {
      expect(() => untilConsolePatternContract.parse('/hydrated/')).toThrow(
        /a regex SOURCE string, not a regex literal/u,
      );
    });
  });

  describe('an uncompilable pattern', () => {
    it('INVALID: {value: "(unterminated"} => throws for a pattern that will not compile', () => {
      expect(() => untilConsolePatternContract.parse('(unterminated')).toThrow(
        /must be a compilable regular expression source/u,
      );
    });
  });

  describe('an empty string', () => {
    it('EMPTY: {value: ""} => throws for failing the minimum length', () => {
      expect(() => untilConsolePatternContract.parse('')).toThrow(
        /String must contain at least 1/u,
      );
    });
  });
});
