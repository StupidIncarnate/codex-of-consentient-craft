import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { tscOutputParseTransformer } from './tsc-output-parse-transformer';

describe('tscOutputParseTransformer', () => {
  describe('valid output', () => {
    it('VALID: {single error line} => returns single ErrorEntry', () => {
      const output =
        "src/file.ts(10,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.";

      const result = tscOutputParseTransformer({ output });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: 'src/file.ts',
          line: 10,
          column: 5,
          message:
            "TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
          severity: 'error',
        }),
      ]);
    });

    it('VALID: {multiple error lines} => returns multiple ErrorEntry values', () => {
      const output = [
        "src/file.ts(10,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
        "src/file.ts(20,1): error TS2304: Cannot find name 'foo'.",
      ].join('\n');

      const result = tscOutputParseTransformer({ output });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: 'src/file.ts',
          line: 10,
          column: 5,
          message:
            "TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
          severity: 'error',
        }),
        ErrorEntryStub({
          filePath: 'src/file.ts',
          line: 20,
          column: 1,
          message: "TS2304: Cannot find name 'foo'.",
          severity: 'error',
        }),
      ]);
    });

    it('VALID: {warning severity} => returns ErrorEntry with severity warning', () => {
      const output = 'src/file.ts(5,1): warning TS6133: Variable is declared but never used.';

      const result = tscOutputParseTransformer({ output });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: 'src/file.ts',
          line: 5,
          column: 1,
          message: 'TS6133: Variable is declared but never used.',
          severity: 'warning',
        }),
      ]);
    });
  });

  describe('non-matching lines', () => {
    it('EDGE: {non-matching lines mixed with valid} => skips non-matching lines', () => {
      const output = [
        'Found 2 errors.',
        'src/file.ts(10,5): error TS2345: Type mismatch.',
        '',
        'Compilation failed.',
      ].join('\n');

      const result = tscOutputParseTransformer({ output });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: 'src/file.ts',
          line: 10,
          column: 5,
          message: 'TS2345: Type mismatch.',
          severity: 'error',
        }),
      ]);
    });
  });

  describe('empty output', () => {
    it('EMPTY: {empty string} => returns empty array', () => {
      const result = tscOutputParseTransformer({ output: '' });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {only non-matching lines} => returns empty array', () => {
      const result = tscOutputParseTransformer({ output: 'Found 0 errors.\n' });

      expect(result).toStrictEqual([]);
    });
  });
});
