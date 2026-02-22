import { formattedToolInputContract } from './formatted-tool-input-contract';
import { FormattedToolInputStub } from './formatted-tool-input.stub';

describe('formattedToolInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {fields with single entry} => parses successfully', () => {
      const result = formattedToolInputContract.parse({
        fields: [{ key: 'command', value: 'ls -la', isLong: false }],
      });

      expect(result).toStrictEqual({
        fields: [{ key: 'command', value: 'ls -la', isLong: false }],
      });
    });

    it('VALID: {fields with multiple entries} => parses successfully', () => {
      const result = formattedToolInputContract.parse({
        fields: [
          { key: 'file_path', value: '/src/index.ts', isLong: false },
          { key: 'content', value: 'hello', isLong: false },
        ],
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'file_path', value: '/src/index.ts', isLong: false },
          { key: 'content', value: 'hello', isLong: false },
        ],
      });
    });

    it('VALID: {empty fields array} => parses successfully', () => {
      const result = formattedToolInputContract.parse({ fields: [] });

      expect(result).toStrictEqual({ fields: [] });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {missing fields} => throws', () => {
      expect(() => formattedToolInputContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID_VALUE: {field missing key} => throws', () => {
      expect(() =>
        formattedToolInputContract.parse({
          fields: [{ value: 'test', isLong: false }],
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid formatted tool input', () => {
      const result = FormattedToolInputStub();

      expect(result).toStrictEqual({
        fields: [{ key: 'command', value: 'ls -la', isLong: false }],
      });
    });
  });
});
