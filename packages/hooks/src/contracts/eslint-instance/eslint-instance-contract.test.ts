import { eslintInstanceContract } from './eslint-instance-contract';
import { EslintInstanceStub } from './eslint-instance.stub';

describe('eslintInstanceContract', () => {
  describe('valid eslint instance', () => {
    it('VALID: {} => parses successfully', () => {
      const result = eslintInstanceContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {calculateConfigForFile} => includes function property', async () => {
      const instance = EslintInstanceStub();

      const result = await instance.calculateConfigForFile?.('/test.ts');

      expect(result).toStrictEqual({});
    });

    it('VALID: {isPathIgnored} => defaults to not ignored', async () => {
      const instance = EslintInstanceStub();

      const result = await instance.isPathIgnored?.('/test.ts');

      expect(result).toBe(false);
    });
  });
});
