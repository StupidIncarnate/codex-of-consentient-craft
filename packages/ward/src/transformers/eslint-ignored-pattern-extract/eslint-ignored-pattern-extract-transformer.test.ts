
import { eslintIgnoredPatternExtractTransformer } from './eslint-ignored-pattern-extract-transformer';

describe('eslintIgnoredPatternExtractTransformer', () => {
  describe('ignored-pattern crash', () => {
    it('VALID: {eslint all-ignored crash text} => returns the named pattern', () => {
      const output =
        'Oops! Something went wrong! :(\n\nESLint: 9.36.0\n\nYou are linting "test/fixtures/ban-proxy-empty-called-with", but all of the files matching the glob pattern "test/fixtures/ban-proxy-empty-called-with" are ignored.\n\nIf you don\'t want to lint these files, remove the pattern.';

      const result = eslintIgnoredPatternExtractTransformer({ output });

      expect(result).toBe(
        'test/fixtures/ban-proxy-empty-called-with',
      );
    });
  });

  describe('other output', () => {
    it.each([
      '',
      '[]',
      'Oops! Something went wrong! See above for details.',
      'You are linting "a/b", but all of the files matching the glob pattern "c/d" are ignored.',
      '[{"filePath":"You are linting"}]',
    ])('EMPTY: {output: %s} => returns undefined', (output) => {
      const result = eslintIgnoredPatternExtractTransformer({ output });

      expect(result).toBe(undefined);
    });
  });
});
