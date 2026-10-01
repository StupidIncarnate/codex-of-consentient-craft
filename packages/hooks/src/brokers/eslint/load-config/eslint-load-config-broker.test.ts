import { eslintLoadConfigBroker } from './eslint-load-config-broker';
import { eslintLoadConfigBrokerProxy } from './eslint-load-config-broker.proxy';

describe('eslintLoadConfigBroker', () => {
  describe('valid input', () => {
    it('VALID: {cwd: "/project", filePath: "test.ts"} => returns the config ESLint calculates for that file', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'test.ts',
        config: { rules: { 'no-unused-vars': 'error' } },
      });

      const result = await eslintLoadConfigBroker({
        cwd: '/project',
        filePath: 'test.ts',
      });

      expect(result).toStrictEqual({ rules: { 'no-unused-vars': 'error' } });
    });

    it('VALID: {filePath: "default-cwd.ts"} => resolves the config for that file with the default cwd', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'default-cwd.ts',
        config: { rules: { 'default-cwd-marker': 'error' } },
      });

      const result = await eslintLoadConfigBroker({
        filePath: 'default-cwd.ts',
      });

      expect(result).toStrictEqual({ rules: { 'default-cwd-marker': 'error' } });
    });

    it('VALID: same cwd and file asked twice => second call is served from cache without asking ESLint', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'cached.ts',
        config: { rules: { 'no-undef': 'error' } },
      });

      const result1 = await eslintLoadConfigBroker({ cwd: '/cache-test', filePath: 'cached.ts' });
      const result2 = await eslintLoadConfigBroker({ cwd: '/cache-test', filePath: 'cached.ts' });

      expect({
        result1,
        result2,
        timesAsked: proxy.getCalculatedFor({ filePath: 'cached.ts' }).length,
      }).toStrictEqual({
        result1: { rules: { 'no-undef': 'error' } },
        result2: { rules: { 'no-undef': 'error' } },
        timesAsked: 1,
      });
    });

    it('VALID: same cwd, two files => each gets its own config, since per-file overrides differ', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'flow.e2e.ts',
        config: { rules: { '@dungeonmaster/enforce-test-creation-of-proxy': 'off' } },
      });
      proxy.returnsConfig({
        filePath: 'plain.ts',
        config: { rules: { '@dungeonmaster/enforce-test-creation-of-proxy': 'error' } },
      });

      const e2e = await eslintLoadConfigBroker({ cwd: '/override-test', filePath: 'flow.e2e.ts' });
      const plain = await eslintLoadConfigBroker({ cwd: '/override-test', filePath: 'plain.ts' });

      expect({ e2e, plain }).toStrictEqual({
        e2e: { rules: { '@dungeonmaster/enforce-test-creation-of-proxy': 'off' } },
        plain: { rules: { '@dungeonmaster/enforce-test-creation-of-proxy': 'error' } },
      });
    });

    it('VALID: different cwd => calculates a new config', async () => {
      const proxy = eslintLoadConfigBrokerProxy();
      proxy.returnsConfig({
        filePath: 'first.ts',
        config: { rules: { 'no-undef': 'error' } },
      });
      proxy.returnsConfig({
        filePath: 'second.ts',
        config: { rules: { 'no-console': 'warn' } },
      });

      const result1 = await eslintLoadConfigBroker({ cwd: '/test1', filePath: 'first.ts' });
      const result2 = await eslintLoadConfigBroker({ cwd: '/test2', filePath: 'second.ts' });

      expect({ result1, result2 }).toStrictEqual({
        result1: { rules: { 'no-undef': 'error' } },
        result2: { rules: { 'no-console': 'warn' } },
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
        config: { rules: { 'no-console': 'error' } },
      });

      const result = await eslintLoadConfigBroker({
        cwd: '/fallback-config-test',
        filePath: 'ignored-with-fallback.ts',
      });

      expect(result).toStrictEqual({ rules: { 'no-console': 'error' } });
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
