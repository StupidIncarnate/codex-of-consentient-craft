import { eslintLoadConfigBroker } from './eslint-load-config-broker';
import { eslintLoadConfigBrokerProxy } from './eslint-load-config-broker.proxy';
import { LinterConfigStub } from '../../../contracts/linter-config/linter-config.stub';

describe('eslintLoadConfigBroker', () => {
  describe('valid input', () => {
    it('VALID: {cwd: "/project", filePath: "test.ts"} => returns the config ESLint calculates for that file', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'test.ts',
        config: LinterConfigStub({ rules: { 'no-unused-vars': 'error' } }),
      });

      const result = await eslintLoadConfigBroker({
        cwd: '/project',
        filePath: 'test.ts',
      });

      expect(result).toStrictEqual(LinterConfigStub({ rules: { 'no-unused-vars': 'error' } }));
    });

    it('VALID: {filePath: "default-cwd.ts"} => resolves the config for that file with the default cwd', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'default-cwd.ts',
        config: LinterConfigStub({ rules: { 'default-cwd-marker': 'error' } }),
      });

      const result = await eslintLoadConfigBroker({
        filePath: 'default-cwd.ts',
      });

      expect(result).toStrictEqual(LinterConfigStub({ rules: { 'default-cwd-marker': 'error' } }));
    });

    it('VALID: same cwd called twice => second call is served from cache without asking ESLint', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'file1.ts',
        config: LinterConfigStub({ rules: { 'no-undef': 'error' } }),
      });

      const result1 = await eslintLoadConfigBroker({ cwd: '/test', filePath: 'file1.ts' });
      const result2 = await eslintLoadConfigBroker({ cwd: '/test', filePath: 'file2.ts' });

      expect({
        result1,
        result2,
        askedAboutFile2: proxy.getCalculatedFor({ filePath: 'file2.ts' }),
      }).toStrictEqual({
        result1: LinterConfigStub({ rules: { 'no-undef': 'error' } }),
        result2: LinterConfigStub({ rules: { 'no-undef': 'error' } }),
        askedAboutFile2: [],
      });
    });

    it('VALID: different cwd => calculates a new config', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'first.ts',
        config: LinterConfigStub({ rules: { 'no-undef': 'error' } }),
      });
      proxy.returnsConfig({
        filePath: 'second.ts',
        config: LinterConfigStub({ rules: { 'no-console': 'warn' } }),
      });

      const result1 = await eslintLoadConfigBroker({ cwd: '/test1', filePath: 'first.ts' });
      const result2 = await eslintLoadConfigBroker({ cwd: '/test2', filePath: 'second.ts' });

      expect({ result1, result2 }).toStrictEqual({
        result1: LinterConfigStub({ rules: { 'no-undef': 'error' } }),
        result2: LinterConfigStub({ rules: { 'no-console': 'warn' } }),
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: calculateConfigForFile returns null everywhere => returns empty config', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsNullConfig({ filePath: 'ignored.ts' });
      proxy.returnsNullConfig({ filePath: 'fallback.ts' });

      const result = await eslintLoadConfigBroker({
        cwd: '/null-config-test',
        filePath: 'ignored.ts',
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: the file is ignored but a fallback path has rules => returns the fallback config', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsNullConfig({ filePath: 'ignored-with-fallback.ts' });
      proxy.returnsConfig({
        filePath: 'fallback.ts',
        config: LinterConfigStub({ rules: { 'no-console': 'error' } }),
      });

      const result = await eslintLoadConfigBroker({
        cwd: '/fallback-config-test',
        filePath: 'ignored-with-fallback.ts',
      });

      expect(result).toStrictEqual(LinterConfigStub({ rules: { 'no-console': 'error' } }));
    });
  });

  describe('error handling', () => {
    it('ERROR: ESLint constructor throws => throws formatted error naming the cause', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.throwsOnConstruction({
        cwd: '/error-test-1',
        error: new Error('ESLint configuration error'),
      });

      await expect(
        eslintLoadConfigBroker({
          cwd: '/error-test-1',
          filePath: 'test.ts',
        }),
      ).rejects.toThrow(/^Failed to load ESLint configuration: ESLint configuration error$/u);
    });

    it('ERROR: calculateConfigForFile rejects => throws formatted error naming the cause', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.throwsOnCalculate({
        filePath: 'invalid.ts',
        error: new Error('Config calculation failed'),
      });

      await expect(
        eslintLoadConfigBroker({
          cwd: '/error-test-2',
          filePath: 'invalid.ts',
        }),
      ).rejects.toThrow(/^Failed to load ESLint configuration: Config calculation failed$/u);
    });
  });
});
