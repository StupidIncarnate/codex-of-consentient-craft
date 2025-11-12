import { partialEslintConfigContract } from './partial-eslint-config-contract';
import { PartialEslintConfigStub } from './partial-eslint-config.stub';

describe('partialEslintConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: {rules: empty object} => parses successfully', () => {
      const config = PartialEslintConfigStub({
        rules: {},
      });

      const result = partialEslintConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: {},
      });
    });

    it('VALID: {rules: with no-console error} => parses successfully', () => {
      const config = PartialEslintConfigStub({
        rules: { 'no-console': 'error' },
      });

      const result = partialEslintConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: { 'no-console': 'error' },
      });
    });

    it('VALID: {no rules field} => parses successfully', () => {
      const config = PartialEslintConfigStub({});

      const result = partialEslintConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: {},
      });
    });
  });

  describe('invalid configs', () => {
    it('INVALID_TYPE: {rules: string} => throws validation error', () => {
      expect(() => {
        return partialEslintConfigContract.parse({
          rules: 'invalid',
        });
      }).toThrow(/Expected object, received string/u);
    });

    it('INVALID_TYPE: {rules: array} => throws validation error', () => {
      expect(() => {
        return partialEslintConfigContract.parse({
          rules: ['no-console'],
        });
      }).toThrow(/Expected object, received array/u);
    });
  });
});
