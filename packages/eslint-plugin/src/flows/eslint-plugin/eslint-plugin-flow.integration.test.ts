import { EslintPluginFlow } from './eslint-plugin-flow';

describe('EslintPluginFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {} => delegates to responder and returns plugin with rules and configs', () => {
      const plugin = EslintPluginFlow();

      expect(Object.keys(plugin.rules)).toStrictEqual([
        'ban-adhoc-types',
        'ban-primitives',
        'enforce-contract-usage-in-tests',
        'ban-jest-mock-in-tests',
        'require-zod-on-primitives',
        'explicit-return-types',
        'enforce-project-structure',
        'enforce-import-dependencies',
        'enforce-jest-mocked-usage',
        'enforce-magic-arrays',
        'enforce-object-destructuring-params',
        'enforce-optional-guard-params',
        'enforce-stub-patterns',
        'enforce-stub-usage',
        'enforce-proxy-child-creation',
        'enforce-proxy-patterns',
        'enforce-test-colocation',
        'enforce-test-creation-of-proxy',
        'enforce-test-proxy-imports',
        'enforce-implementation-colocation',
        'forbid-non-exported-functions',
        'forbid-type-reexport',
        'jest-mocked-must-import',
        'no-mutable-state-in-proxy-factory',
        'require-contract-validation',
        'no-multiple-property-assertions',
        'forbid-todo-skip',
        'enforce-regex-usage',
        'enforce-file-metadata',
        'ban-fetch-in-proxies',
        'ban-startup-branching',
      ]);
      expect(Object.keys(plugin.configs)).toStrictEqual(['dungeonmaster', 'dungeonmasterTest']);
    });
  });
});
