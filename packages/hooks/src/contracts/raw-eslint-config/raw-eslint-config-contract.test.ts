import { rawEslintConfigContract } from './raw-eslint-config-contract';
import { RawEslintConfigStub } from './raw-eslint-config.stub';

describe('rawEslintConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: {rules: empty object} => parses successfully', () => {
      const config = RawEslintConfigStub({
        rules: {},
      });

      const result = rawEslintConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: {},
        language: { fileType: 'text' },
      });
    });

    it('VALID: {rules with language object} => parses successfully', () => {
      const config = RawEslintConfigStub({
        rules: { 'no-console': 'error' },
        language: { fileType: 'text', lineStart: 1 },
      });

      const result = rawEslintConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: { 'no-console': 'error' },
        language: { fileType: 'text', lineStart: 1 },
      });
    });

    it('VALID: {no rules field} => parses successfully', () => {
      const config = RawEslintConfigStub({
        language: { fileType: 'text' },
      });

      const result = rawEslintConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: {},
        language: { fileType: 'text' },
      });
    });
  });
});
