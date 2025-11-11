import { eslintLoadConfigBroker } from './eslint-load-config-broker';
import { eslintLoadConfigBrokerProxy } from './eslint-load-config-broker.proxy';
import { LinterConfigStub } from '../../../contracts/linter-config/linter-config.stub';

describe('eslintLoadConfigBroker', () => {
  describe('valid input', () => {
    it('VALID: {cwd: "/project", filePath: "test.ts"} => returns eslint config', async () => {
      eslintLoadConfigBrokerProxy();

      const result = await eslintLoadConfigBroker({
        cwd: '/project',
        filePath: 'test.ts',
      });

      const expected = LinterConfigStub({ rules: { 'no-unused-vars': 'error' } });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: {filePath: "test.ts"} => returns eslint config with default cwd', async () => {
      eslintLoadConfigBrokerProxy();

      const result = await eslintLoadConfigBroker({
        filePath: 'test.ts',
      });

      const expected = LinterConfigStub({ rules: { 'no-console': 'warn' } });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: same cwd called twice => returns cached config on second call', async () => {
      eslintLoadConfigBrokerProxy();

      const result1 = await eslintLoadConfigBroker({ cwd: '/test', filePath: 'file1.ts' });
      const result2 = await eslintLoadConfigBroker({ cwd: '/test', filePath: 'file2.ts' });

      const expected = LinterConfigStub({ rules: { 'no-undef': 'error' } });

      expect(result1).toStrictEqual(expected);
      expect(result2).toStrictEqual(expected);
    });

    it('VALID: different cwd => calculates new config', async () => {
      eslintLoadConfigBrokerProxy();

      const result1 = await eslintLoadConfigBroker({ cwd: '/test1', filePath: 'file.ts' });
      const result2 = await eslintLoadConfigBroker({ cwd: '/test2', filePath: 'file.ts' });

      const expected1 = LinterConfigStub({ rules: { 'no-undef': 'error' } });
      const expected2 = LinterConfigStub({ rules: { 'no-console': 'warn' } });

      expect(result1).toStrictEqual(expected1);
      expect(result2).toStrictEqual(expected2);
    });
  });

  describe('edge cases', () => {
    it('EDGE: calculateConfigForFile returns null => returns empty config', async () => {
      eslintLoadConfigBrokerProxy();

      const result = await eslintLoadConfigBroker({
        filePath: 'test.ts',
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('error handling', () => {
    it('ERROR: ESLint constructor throws => throws formatted error', async () => {
      eslintLoadConfigBrokerProxy();

      await expect(
        eslintLoadConfigBroker({
          cwd: '/error-test-1',
          filePath: 'test.ts',
        }),
      ).rejects.toThrow(/Failed to load ESLint configuration/u);
    });

    it('ERROR: calculateConfigForFile throws => throws formatted error', async () => {
      eslintLoadConfigBrokerProxy();

      await expect(
        eslintLoadConfigBroker({
          cwd: '/error-test-2',
          filePath: 'invalid.ts',
        }),
      ).rejects.toThrow(/Failed to load ESLint configuration/u);
    });

    it('ERROR: non-Error thrown => throws formatted error with string conversion', async () => {
      eslintLoadConfigBrokerProxy();

      await expect(
        eslintLoadConfigBroker({
          cwd: '/error-test-3',
          filePath: 'test.ts',
        }),
      ).rejects.toThrow(/Failed to load ESLint configuration/u);
    });
  });
});
