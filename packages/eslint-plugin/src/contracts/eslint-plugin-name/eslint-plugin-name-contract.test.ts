import { eslintPluginNameContract } from './eslint-plugin-name-contract';
import { EslintPluginNameStub } from './eslint-plugin-name.stub';

describe('eslintPluginNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "@typescript-eslint"} => parses successfully', () => {
      const name = EslintPluginNameStub({ value: '@typescript-eslint' });

      const result = eslintPluginNameContract.parse(name);

      expect(result).toBe('@typescript-eslint');
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => eslintPluginNameContract.parse(123 as never)).toThrow(/expected string/u);
    });
  });
});
