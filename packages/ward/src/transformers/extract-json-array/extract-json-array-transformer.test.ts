import { extractJsonArrayTransformer } from './extract-json-array-transformer';

describe('extractJsonArrayTransformer', () => {
  describe('valid JSON extraction', () => {
    it('VALID: {pure JSON array string} => returns unchanged', () => {
      const output = '[{"key":"value"}]';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe('[{"key":"value"}]');
    });

    it('VALID: {JSON array with trailing text} => returns only array', () => {
      const output = '[{"key":"value"}]FAIL src/file.test.ts';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe('[{"key":"value"}]');
    });

    it('VALID: {text before JSON array} => returns only array', () => {
      const output = 'PASS src/other.test.ts\n[{"key":"value"}]';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe('[{"key":"value"}]');
    });

    it('VALID: {JSON array with nested brackets in strings} => returns complete array', () => {
      const json = JSON.stringify([{ message: 'error TS2552: Cannot find name [foo]' }]);
      const output = `${json}extra text`;

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe(json);
    });

    it('VALID: {JSON array with escaped quotes in strings} => returns complete array', () => {
      const json = JSON.stringify([{ message: 'said "hello"' }]);
      const output = `${json}trailing`;

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe(json);
    });

    it('VALID: {JSON array with nested arrays} => returns complete array', () => {
      const json = JSON.stringify([
        [1, 2],
        [3, [4, 5]],
      ]);
      const output = `prefix${json}suffix`;

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe(json);
    });

    it('VALID: {stderr contamination after JSON array} => returns only array', () => {
      const json = JSON.stringify([{ filePath: 'a.ts', messages: [] }]);
      const output = `${json}ts-jest[ts-compiler] (WARN) Unable to process`;

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe(json);
    });
  });

  describe('no JSON present', () => {
    it('EMPTY: {no brackets in output} => returns original string', () => {
      const output = 'PASS all tests passed';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe(output);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {unclosed JSON array} => returns original string unchanged', () => {
      const output = '[{"key":"value"';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe(output);
    });

    it('EDGE: {empty JSON array} => returns empty array string', () => {
      const output = '[]';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe('[]');
    });

    it('EDGE: {empty JSON array with surrounding text} => extracts empty array', () => {
      const output = 'prefix[]suffix';

      const result = extractJsonArrayTransformer({ output });

      expect(result).toBe('[]');
    });
  });
});
