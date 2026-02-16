import { errorEntryContract } from './error-entry-contract';
import { ErrorEntryStub } from './error-entry.stub';

describe('errorEntryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full error entry with rule} => parses successfully', () => {
      const result = errorEntryContract.parse(ErrorEntryStub({ rule: 'no-any' }));

      expect(result).toStrictEqual({
        filePath: 'src/index.ts',
        line: 10,
        column: 5,
        message: 'Unexpected any',
        rule: 'no-any',
        severity: 'error',
      });
    });

    it('VALID: {warning severity without rule} => parses successfully', () => {
      const result = errorEntryContract.parse(ErrorEntryStub({ severity: 'warning' }));

      expect(result).toStrictEqual({
        filePath: 'src/index.ts',
        line: 10,
        column: 5,
        message: 'Unexpected any',
        severity: 'warning',
      });
    });

    it('VALID: {error severity without rule} => parses without optional rule', () => {
      const result = errorEntryContract.parse({
        filePath: 'src/app.ts',
        line: 1,
        column: 1,
        message: 'Missing return type',
        severity: 'error',
      });

      expect(result).toStrictEqual({
        filePath: 'src/app.ts',
        line: 1,
        column: 1,
        message: 'Missing return type',
        severity: 'error',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SEVERITY: {severity: "info"} => throws validation error', () => {
      expect(() =>
        errorEntryContract.parse({
          filePath: 'src/index.ts',
          line: 10,
          column: 5,
          message: 'test',
          severity: 'info',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID_LINE: {line: "ten"} => throws validation error', () => {
      expect(() =>
        errorEntryContract.parse({
          filePath: 'src/index.ts',
          line: 'ten' as never,
          column: 5,
          message: 'test',
          severity: 'error',
        }),
      ).toThrow(/Expected number/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => errorEntryContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid error entry', () => {
      const result = ErrorEntryStub();

      expect(result).toStrictEqual({
        filePath: 'src/index.ts',
        line: 10,
        column: 5,
        message: 'Unexpected any',
        severity: 'error',
      });
    });

    it('VALID: {custom values} => creates error entry with overrides', () => {
      const result = ErrorEntryStub({
        filePath: 'src/app.ts',
        line: 20,
        column: 1,
        message: 'Custom error',
        rule: 'custom-rule',
        severity: 'warning',
      });

      expect(result).toStrictEqual({
        filePath: 'src/app.ts',
        line: 20,
        column: 1,
        message: 'Custom error',
        rule: 'custom-rule',
        severity: 'warning',
      });
    });
  });
});
