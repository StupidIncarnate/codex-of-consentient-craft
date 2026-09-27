import { jsonFileContentsTransformer } from './json-file-contents-transformer';

describe('jsonFileContentsTransformer', () => {
  describe('valid input', () => {
    it('VALID: {value: {name: "x"}} => returns 2-space indented JSON ending in one trailing newline', () => {
      const result = jsonFileContentsTransformer({ value: { name: 'x' } });

      expect(result).toBe('{\n  "name": "x"\n}\n');
    });

    it('VALID: {value: nested object} => preserves key order and nests with 2-space indent', () => {
      const result = jsonFileContentsTransformer({
        value: { devDependencies: { jest: '^30.0.0', typescript: '^5.8.3' } },
      });

      expect(result).toBe(
        '{\n  "devDependencies": {\n    "jest": "^30.0.0",\n    "typescript": "^5.8.3"\n  }\n}\n',
      );
    });

    it('VALID: {value: array} => stringifies the array with 2-space indent and a trailing newline', () => {
      const result = jsonFileContentsTransformer({ value: ['a', 'b'] });

      expect(result).toBe('[\n  "a",\n  "b"\n]\n');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {value: {}} => returns an empty object literal with a trailing newline', () => {
      const result = jsonFileContentsTransformer({ value: {} });

      expect(result).toBe('{}\n');
    });
  });
});
