import { formattedToolFieldContract } from './formatted-tool-field-contract';
import { FormattedToolFieldStub } from './formatted-tool-field.stub';

describe('formattedToolFieldContract', () => {
  describe('valid inputs', () => {
    it('VALID: {key, value, isLong: false} => parses successfully', () => {
      const result = formattedToolFieldContract.parse({
        key: 'command',
        value: 'ls -la',
        isLong: false,
      });

      expect(result).toStrictEqual({ key: 'command', value: 'ls -la', isLong: false });
    });

    it('VALID: {isLong: true} => parses successfully', () => {
      const result = formattedToolFieldContract.parse({
        key: 'content',
        value: 'line one\nline two',
        isLong: true,
      });

      expect(result).toStrictEqual({ key: 'content', value: 'line one\nline two', isLong: true });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing key} => throws', () => {
      expect(() => formattedToolFieldContract.parse({ value: 'ls -la', isLong: false })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {key: ""} => throws', () => {
      expect(() =>
        formattedToolFieldContract.parse({ key: '', value: 'ls -la', isLong: false }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing value} => throws', () => {
      expect(() => formattedToolFieldContract.parse({ key: 'command', isLong: false })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {missing isLong} => throws', () => {
      expect(() => formattedToolFieldContract.parse({ key: 'command', value: 'ls -la' })).toThrow(
        /Required/u,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a valid field', () => {
      const result = FormattedToolFieldStub();

      expect(result).toStrictEqual({ key: 'command', value: 'ls -la', isLong: false });
    });

    it('VALID: {override key, value, isLong} => creates a field with the overrides applied', () => {
      const result = FormattedToolFieldStub({ key: 'content', value: 'a\nb', isLong: true });

      expect(result).toStrictEqual({ key: 'content', value: 'a\nb', isLong: true });
    });
  });
});
